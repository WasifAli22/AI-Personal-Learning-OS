import asyncio
import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

os.environ['GROQ_API_KEY'] = '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'

from app.services.ai_service import AIService

async def test():
    ai = AIService()
    
    print("=== Testing generate_quiz ===")
    result = await ai.generate_quiz(
        "Python is a programming language. Variables store data. Functions are reusable code blocks.",
        num_questions=3,
        difficulty="medium",
        question_types=["mcq"]
    )
    if "error" in result:
        print("ERROR:", result["error"])
    else:
        print("SUCCESS! Title:", result.get("title"))
        print("Questions:", len(result.get("questions", [])))
        q = result["questions"][0]
        print("First Q:", q.get("question", "")[:80])

    print("\n=== Testing generate_flashcards ===")
    result2 = await ai.generate_flashcards(
        "Python is a programming language. It was created by Guido van Rossum in 1991.",
        num_cards=3
    )
    if "error" in result2:
        print("ERROR:", result2["error"])
    else:
        print("SUCCESS! Cards:", len(result2.get("cards", [])))

    print("\n=== Testing get_recommendations ===")
    result3 = await ai.get_recommendations({"current_streak": 3, "average_quiz_score": 72, "weak_topics": ["algebra"]})
    print("Recs:", result3[:2])

if __name__ == "__main__":
    asyncio.run(test())
