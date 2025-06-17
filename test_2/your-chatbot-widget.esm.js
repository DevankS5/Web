class YourChatbotWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chatbotId = '';
        this.isPopup = false;
        this.width = '350px';
        this.height = '500px';
        this.themeColor = '#007bff';
        this.welcomeMessage = 'Hello! How can I help you today?';
        this.isOpen = false; // For popup state
        this.messages = [];
    }

    static get observedAttributes() {
        return ['chatbot-id', 'is-popup', 'width', 'height', 'theme-color', 'welcome-message'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'chatbot-id':
                this.chatbotId = newValue;
                break;
            case 'is-popup':
                this.isPopup = newValue === 'true';
                break;
            case 'width':
                this.width = newValue;
                break;
            case 'height':
                this.height = newValue;
                break;
            case 'theme-color':
                this.themeColor = newValue;
                break;
            case 'welcome-message':
                this.welcomeMessage = newValue;
                break;
        }
        // Re-render if attributes change after initial setup,
        // though for some (like is-popup), initial setup is key.
        if (this.shadowRoot.innerHTML) { // Check if already rendered
            this._render();
        }
    }

    connectedCallback() {
        // Defer rendering to allow attributes to be set by the host page
        // before the component tries to render.
        setTimeout(() => {
            this._render();
            if (this.isPopup) {
                this._addPopupLauncher();
                // Initially hide the main chat window for popup
                const chatContainer = this.shadowRoot.querySelector('.chat-widget-container');
                if (chatContainer) chatContainer.style.display = 'none';
            } else {
                // For inline, add welcome message directly
                this._addMessage(this.welcomeMessage, 'bot');
            }
        }, 0);
    }

    _render() {
        // Ensure that attributes are read at render time
        this.chatbotId = this.getAttribute('chatbot-id') || this.chatbotId;
        this.isPopup = this.getAttribute('is-popup') === 'true';
        this.width = this.getAttribute('width') || this.width;
        this.height = this.getAttribute('height') || this.height;
        this.themeColor = this.getAttribute('theme-color') || this.themeColor;
        this.welcomeMessage = this.getAttribute('welcome-message') || this.welcomeMessage;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block; /* Default for inline */
                }
                .chat-widget-container {
                    width: ${this.isPopup ? this.width : (this.getAttribute('width') || this.width)};
                    height: ${this.isPopup ? this.height : (this.getAttribute('height') || this.height)};
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    background-color: #fff;
                    position: ${this.isPopup ? 'fixed' : 'relative'};
                    bottom: ${this.isPopup ? '20px' : 'auto'};
                    right: ${this.isPopup ? '20px' : 'auto'};
                    z-index: ${this.isPopup ? 1000 : 'auto'};
                }
                .chat-header {
                    background-color: ${this.themeColor};
                    color: white;
                    padding: 10px 15px;
                    font-size: 1.1em;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .chat-header .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2em;
                    cursor: pointer;
                }
                .chat-messages {
                    flex-grow: 1;
                    padding: 15px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background-color: #f9f9f9;
                }
                .message {
                    padding: 8px 12px;
                    border-radius: 18px;
                    max-width: 75%;
                    word-wrap: break-word;
                }
                .message.user {
                    background-color: ${this.themeColor};
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }
                .message.bot {
                    background-color: #e9e9eb;
                    color: #333;
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                }
                .chat-input-area {
                    display: flex;
                    padding: 10px;
                    border-top: 1px solid #ccc;
                    background-color: #fff;
                }
                .chat-input-area input {
                    flex-grow: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    margin-right: 8px;
                    font-size: 1em;
                }
                .chat-input-area button {
                    padding: 10px 15px;
                    background-color: ${this.themeColor};
                    color: white;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 1em;
                }
                .chat-input-area button:hover {
                    opacity: 0.9;
                }
                .popup-launcher {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: ${this.themeColor};
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 999;
                    font-size: 24px;
                }
            </style>
            <div class="chat-widget-container" style="${this.isPopup && !this.isOpen ? 'display: none;' : ''}">
                <div class="chat-header">
                    <span>ChatBot (${this.chatbotId})</span>
                    ${this.isPopup ? '<button class="close-btn">&times;</button>' : ''}
                </div>
                <div class="chat-messages">
                    <!-- Messages will be appended here -->
                </div>
                <div class="chat-input-area">
                    <input type="text" placeholder="Type your message...">
                    <button>Send</button>
                </div>
            </div>
        `;

        const input = this.shadowRoot.querySelector('.chat-input-area input');
        const sendButton = this.shadowRoot.querySelector('.chat-input-area button');
        const closeButton = this.shadowRoot.querySelector('.chat-header .close-btn');

        sendButton.addEventListener('click', () => this._sendMessage(input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._sendMessage(input);
            }
        });

        if (closeButton) {
            closeButton.addEventListener('click', () => this._togglePopup());
        }
    }

    _addPopupLauncher() {
        if (this.shadowRoot.querySelector('.popup-launcher')) return; // Avoid duplicate launchers

        const launcher = document.createElement('div');
        launcher.classList.add('popup-launcher');
        launcher.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        `; // Simple chat icon
        // Apply theme color to launcher button explicitly if needed, or use CSS variables
        launcher.style.backgroundColor = this.themeColor;


        launcher.addEventListener('click', () => this._togglePopup());
        this.shadowRoot.appendChild(launcher); // Append to shadow DOM to keep styles encapsulated
    }

    _togglePopup() {
        this.isOpen = !this.isOpen;
        const chatContainer = this.shadowRoot.querySelector('.chat-widget-container');
        const launcher = this.shadowRoot.querySelector('.popup-launcher');

        if (this.isOpen) {
            chatContainer.style.display = 'flex';
            if (launcher) launcher.style.display = 'none'; // Hide launcher when chat is open
            // Add welcome message if opening for the first time and no messages yet
            if (this.messages.length === 0) {
                 this._addMessage(this.welcomeMessage, 'bot');
            }
        } else {
            chatContainer.style.display = 'none';
            if (launcher) launcher.style.display = 'flex'; // Show launcher when chat is closed
        }
    }

    _sendMessage(inputElement) {
        const messageText = inputElement.value.trim();
        if (!messageText) return;

        this._addMessage(messageText, 'user');
        inputElement.value = '';

        // Simulate bot response (echo for prototype)
        setTimeout(() => {
            this._handleBotResponse(messageText);
        }, 500);
    }

    _addMessage(text, type) {
        const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom

        // Store message history if needed (for popup persistence within session)
        this.messages.push({ text, type });
    }

    _handleBotResponse(userMessage) {
        // For prototype: Echo back the user's message as a "bot response"
        // In a real scenario, this would involve an API call to your RAG model
        const botResponse = `You said: "${userMessage}". (This is a prototype echo.)`;
        this._addMessage(botResponse, 'bot');
    }
}

customElements.define('your-chatbot-embed', YourChatbotWidget);