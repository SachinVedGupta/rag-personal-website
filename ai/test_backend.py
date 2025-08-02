import requests
import json

BASE_URL = "http://localhost:5000"

def reset_db():
    response = requests.post(f"{BASE_URL}/reset_db")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Database reset! Loaded {data.get('documents', 0)} documents")
    else:
        print(f"❌ Error: {response.text}")

def ask_question():
    question = input("Question: ")
    payload = {"question": question}
    response = requests.post(f"{BASE_URL}/ask", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Answer: {data['answer']}")
    else:
        print(f"❌ Error: {response.text}")

def main():
    print("1. Reset database")
    print("2. Ask question")
    print("3. Exit")
    
    choice = input("Choose (1/2/3): ")
    
    if choice == "1":
        reset_db()
    elif choice == "2":
        ask_question()
    elif choice == "3":
        print("Goodbye!")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()