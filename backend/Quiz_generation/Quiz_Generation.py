
import google.generativeai as genai
import json

def generate_quiz(topic, num_questions=5):
    """
    Generate a quiz on the given topic using Gemini 2.5 API and return as JSON.
    """
    GEMINI_API_KEY = "Your api key"
    genai.configure(api_key=GEMINI_API_KEY)

    configuration = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain"
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=configuration
    )

    prompt = f"""
    Create a multiple-choice quiz on the topic: {topic}.
    For each question, provide:
    - The question text
    - Four options (A, B, C, D)
    - The correct answer (A/B/C/D)
    Return the quiz as a JSON array with this format:
    [
      {{
        "question": "...",
        "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
        "answer": "A"
      }},
      ...
    ]
    Number of questions: {num_questions}
    """

    response = None
    try:
        response = model.generate_content(prompt)
        import re
        match = re.search(r'\[\s*{.*?}\s*\]', response.text, re.DOTALL)
        quiz_text = match.group(0) if match else response.text
        quiz_json = json.loads(quiz_text)
        return quiz_json
    except Exception as e:
        if response is not None:
            print("Error parsing Gemini response:", e)
            print("Raw response:", getattr(response, 'text', str(response)))
        else:
            print("Error: Could not get a response from Gemini. Check your API key and internet connection.")
        return None

def main():
    topic = input("Enter the quiz topic: ")
    num_questions = input("Number of questions (default 5): ")
    num_questions = int(num_questions) if num_questions.strip() else 5
    quiz = generate_quiz(topic, num_questions)
    if quiz:
        print(json.dumps(quiz, indent=2, ensure_ascii=False))
    else:
        print("Failed to generate quiz.")

if __name__ == "__main__":
    main()
