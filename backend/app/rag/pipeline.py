"""
RAG Pipeline — Document processing, embedding, and retrieval.
Handles PDF parsing, text chunking, ChromaDB storage, and semantic search.
"""

import os
import uuid
import hashlib
from typing import List, Optional, Tuple
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer

from app.config import get_settings


class RAGPipeline:
    """Complete RAG pipeline: parse → chunk → embed → store → retrieve."""

    def __init__(self):
        settings = get_settings()

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False)
        )

        # Initialize embedding model
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def _get_collection(self, user_id: str) -> chromadb.Collection:
        """Get or create a ChromaDB collection for a user."""
        collection_name = f"user_{user_id.replace('-', '_')[:50]}"
        return self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    async def process_pdf(self, file_path: str, user_id: str, doc_id: str) -> int:
        """
        Process a PDF file: extract text, chunk, embed, and store.
        Returns the number of chunks created.
        """
        # Load PDF
        loader = PyPDFLoader(file_path)
        pages = loader.load()

        # Extract and combine text
        full_text = "\n\n".join([page.page_content for page in pages])

        if not full_text.strip():
            return 0

        # Chunk text
        chunks = self.text_splitter.split_text(full_text)

        if not chunks:
            return 0

        # Generate embeddings
        embeddings = self._generate_embeddings(chunks)

        # Prepare metadata
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "doc_id": doc_id,
                "user_id": user_id,
                "chunk_index": i,
                "source": os.path.basename(file_path),
                "page": pages[min(i, len(pages) - 1)].metadata.get("page", 0) if pages else 0
            }
            for i in range(len(chunks))
        ]

        # Store in ChromaDB
        collection = self._get_collection(user_id)
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )

        return len(chunks)

    async def process_text(self, text: str, user_id: str, doc_id: str, source: str = "text") -> int:
        """Process raw text: chunk, embed, and store."""
        if not text.strip():
            return 0

        chunks = self.text_splitter.split_text(text)
        if not chunks:
            return 0

        embeddings = self._generate_embeddings(chunks)

        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "doc_id": doc_id,
                "user_id": user_id,
                "chunk_index": i,
                "source": source
            }
            for i in range(len(chunks))
        ]

        collection = self._get_collection(user_id)
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )

        return len(chunks)

    async def search(
        self,
        query: str,
        user_id: str,
        n_results: int = 5,
        document_ids: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Semantic search over user's documents.
        Returns relevant chunks with scores.
        """
        collection = self._get_collection(user_id)

        # Generate query embedding
        query_embedding = self._generate_embeddings([query])[0]

        # Build where filter
        where_filter = None
        if document_ids:
            where_filter = {"doc_id": {"$in": document_ids}}

        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        search_results = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                search_results.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                    "relevance_score": 1 - (results["distances"][0][i] if results["distances"] else 0)
                })

        return search_results

    async def get_context_for_query(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        max_context_length: int = 4000
    ) -> Tuple[str, List[dict]]:
        """
        Get formatted context for LLM from relevant chunks.
        Returns (context_string, source_list).
        """
        results = await self.search(query, user_id, n_results=8, document_ids=document_ids)

        context_parts = []
        sources = []
        total_length = 0

        for r in results:
            content = r["content"]
            if total_length + len(content) > max_context_length:
                break
            context_parts.append(content)
            sources.append({
                "source": r["metadata"].get("source", "Unknown"),
                "page": r["metadata"].get("page", 0),
                "relevance": round(r["relevance_score"], 3)
            })
            total_length += len(content)

        context = "\n\n---\n\n".join(context_parts)
        return context, sources

    async def get_all_content(self, user_id: str, document_ids: Optional[List[str]] = None) -> str:
        """Get all stored content for a user (for roadmap/quiz generation)."""
        collection = self._get_collection(user_id)

        where_filter = None
        if document_ids:
            where_filter = {"doc_id": {"$in": document_ids}}

        try:
            results = collection.get(
                where=where_filter,
                include=["documents"]
            )
            if results and results["documents"]:
                return "\n\n".join(results["documents"][:50])  # Limit to 50 chunks
        except Exception:
            pass

        return ""

    async def delete_document(self, user_id: str, doc_id: str):
        """Delete all chunks for a document."""
        collection = self._get_collection(user_id)
        try:
            # Get IDs for this document
            results = collection.get(
                where={"doc_id": doc_id},
                include=[]
            )
            if results and results["ids"]:
                collection.delete(ids=results["ids"])
        except Exception:
            pass


# Singleton
_rag_pipeline: Optional[RAGPipeline] = None


def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline
