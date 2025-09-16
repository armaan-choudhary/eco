import google.generativeai as genai
from flask import Flask, render_template_string, request, jsonify

app = Flask(__name__)

# Replace with your Gemini API key
GEMINI_API_KEY = "AIzaSyDOBRDWX6MnYNhsVbbI7nJ9xmX1D67nqQU"
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

HTML_PAGE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Chat Bot</title>
    <style>
        #chatbot {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            display: none;
            flex-direction: column;
        }
        #chat-header {
            background: #0078d7;
            color: #fff;
            padding: 10px;
            border-radius: 10px 10px 0 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #close-chat {
            background: transparent;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
        }
        #chat-messages {
            height: 250px;
            overflow-y: auto;
            padding: 10px;
            background: #f9f9f9;
        }
        #chat-input {
            display: flex;
            border-top: 1px solid #eee;
        }
        #chat-input input {
            flex: 1;
            border: none;
            padding: 10px;
            border-radius: 0 0 0 10px;
        }
        #chat-input button {
            border: none;
            background: #0078d7;
            color: #fff;
            padding: 10px 20px;
            border-radius: 0 0 10px 0;
            cursor: pointer;
        }
        #chatbot-icon {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #0078d7;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 32px;
            cursor: pointer;
            z-index: 9998;
        }
    </style>
</head>
<body>
<div id="chatbot">
    <div id="chat-header">Ask a Doubt <button id="close-chat" title="Close">&times;</button></div>
    <div id="chat-messages"></div>
    <form id="chat-input">
        <input type="text" id="user-input" placeholder="Type your question..." autocomplete="off" required />
        <button type="submit">Send</button>
    </form>
</div>
<div id="chatbot-icon" title="Chat">
    &#128172;
</div>
<script>
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const userInput = document.getElementById('user-input');
const chatbot = document.getElementById('chatbot');
const chatbotIcon = document.getElementById('chatbot-icon');
const closeChat = document.getElementById('close-chat');

function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.innerHTML = `<b>${sender}:</b> ${text}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatInput.onsubmit = async function(e) {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;
    appendMessage('You', question);
    userInput.value = '';
    appendMessage('Bot', '<i>Thinking...</i>');
    const res = await fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({question})
    });
    const data = await res.json();
    chatMessages.lastChild.innerHTML = `<b>Bot:</b> ${data.answer}`;
};

chatbotIcon.onclick = function() {
    chatbot.style.display = 'flex';
    chatbotIcon.style.display = 'none';
};

closeChat.onclick = function() {
    chatbot.style.display = 'none';
    chatbotIcon.style.display = 'flex';
};
</script>
</body>
</html>
'''

@app.route("/")
def index():
    return render_template_string(HTML_PAGE)

@app.route("/ask", methods=["POST"])
def ask():
    user_question = request.json.get("question", "")
    if not user_question:
        return jsonify({"answer": "Please enter a question."})
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
    if user_question.strip().lower() in greetings:
        answer = user_question.strip().capitalize() + "!"
        return jsonify({"answer": answer})
    try:
        prompt = f"You are a helpful assistant. Answer the following doubt in a precise, concise way using minimum words: {user_question}"
        response = model.generate_content(prompt)
        answer = response.text.strip()
    except Exception as e:
        answer = f"Sorry, there was an error: {e}"
    return jsonify({"answer": answer})

if __name__ == "__main__":
    app.run(debug=True)
