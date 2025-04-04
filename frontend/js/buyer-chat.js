document.addEventListener('DOMContentLoaded', function() {
    let currentUser = JSON.parse(localStorage.getItem('userData'));
    let currentChat = null;
    const messagesContainer = document.querySelector('.chat-messages');
    const messageInput = document.querySelector('.chat-input-area input');
    const sendButton = document.querySelector('.send-btn');
    const sellersList = document.querySelector('.sellers-list');
    const propertyModal = document.querySelector('.property-selection-modal');
    const propertiesGrid = document.querySelector('.seller-properties-grid');
    let selectedProperty = null;
    let isLoading = false;

    // Add loading indicator elements
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    function showLoading() {
        isLoading = true;
        document.body.appendChild(loadingIndicator);
    }

    function hideLoading() {
        isLoading = false;
        loadingIndicator.remove();
    }

    // Load sellers
    async function loadSellers() {
        try {
            const response = await fetch('http://localhost:5000/api/users/sellers');
            const data = await response.json();
            if (data.success) {
                renderSellers(data.sellers);
            }
        } catch (err) {
            console.error('Error loading sellers:', err);
        }
    }

    function renderSellers(sellers) {
        sellersList.innerHTML = sellers.map(seller => `
            <div class="seller-item" data-id="${seller._id}">
                <h4>${seller.fullName}</h4>
                <p>${seller.email}</p>
            </div>
        `).join('');
    }

    // Chat functionality
    function initializeChat() {
        loadSellers();
        setupEventListeners();
        setupModalEventListeners();
    }

    function setupEventListeners() {
        sellersList.addEventListener('click', handleSellerSelection);
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
        propertiesGrid.addEventListener('click', async (e) => {
            const propertyCard = e.target.closest('.property-card');
            if (!propertyCard) return;
    
            selectedProperty = {
                id: propertyCard.dataset.id,
                sellerId: propertyCard.dataset.sellerId
            };
    
            propertyModal.style.display = 'none';
            
            // Enable chat input
            messageInput.disabled = false;
            sendButton.disabled = false;
    
            // Update chat header with property details
            const propertyInfo = propertyCard.querySelector('.property-info');
            updateChatHeader(`Enquiring about: ${propertyInfo.querySelector('h3').textContent}`);
    
            // Load previous chat messages
            await loadMessages(selectedProperty.sellerId, selectedProperty.id);
        });
        document.querySelector('.close-modal').onclick = () => {
            propertyModal.style.display = 'none';
        }
    }

    function setupModalEventListeners() {
        // Close modal on overlay click
        propertyModal.addEventListener('click', (e) => {
            if (e.target === propertyModal) {
                propertyModal.style.display = 'none';
            }
        });

        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && propertyModal.style.display === 'block') {
                propertyModal.style.display = 'none';
            }
        });
    }

    async function handleSellerSelection(e) {
        const sellerItem = e.target.closest('.seller-item');
        if (!sellerItem || isLoading) return;

        // Remove active class from all sellers
        document.querySelectorAll('.seller-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected seller
        sellerItem.classList.add('active');

        const sellerId = sellerItem.dataset.id;
        if (!sellerId) {
            showError('Invalid seller selection');
            return;
        }

        const sellerName = sellerItem.querySelector('h4').textContent;
        
        try {
            showLoading();
            const response = await fetch(`http://localhost:5000/api/selling-properties/${sellerId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch properties');
            }

            const data = await response.json();
            
            if (data.success && Array.isArray(data.properties)) {
                if (data.properties.length === 0) {
                    showError('No properties found for this seller');
                    return;
                }
                showPropertyModal(data.properties, sellerName);

                // Store seller details for later use
                currentChat = {
                    sellerId,
                    sellerName
                };
            } else {
                throw new Error(data.message || 'Failed to fetch properties');
            }
        } catch (err) {
            console.error('Error fetching properties:', err);
            showError('Failed to load properties. Please try again.');
        } finally {
            hideLoading();
        }
    }

    function showPropertyModal(properties, sellerName) {
        if (!Array.isArray(properties) || properties.length === 0) {
            showError('No properties available');
            return;
        }

        document.querySelector('.seller-name').textContent = sellerName;
        propertiesGrid.innerHTML = properties.map(property => `
            <div class="property-card" data-id="${property._id}" data-seller-id="${property.sellerId}">
                <img src="${property.imageLink || '../../img/home-1-ahm.jpg'}" 
                     alt="${property.propertyType}"
                     onerror="this.src='../../img/home-1-ahm.jpg'">
                <div class="property-info">
                    <h3>${property.propertyType || 'Property'}</h3>
                    <p>${property.address || 'Location not specified'}</p>
                    <div class="property-price">₹${property.price || 'Price not specified'}</div>
                </div>
            </div>
        `).join('');
        
        propertyModal.style.display = 'block';
    }

    function updateChatHeader(propertyDetails) {
        const chatHeader = document.querySelector('.current-chat-info');
        if (!propertyDetails) {
            chatHeader.innerHTML = `
                <div class="chat-property-info">
                    <h3>Select a property</h3>
                </div>`;
            return;
        }
    
        chatHeader.innerHTML = `
            <div class="chat-property-container">
                <img src="${propertyDetails.imageLink || '../../img/home-1-ahm.jpg'}" 
                     alt="Property" 
                     class="chat-property-img"
                     onerror="this.src='../../img/home-1-ahm.jpg'">
                <div class="chat-property-info">
                    <h3>${propertyDetails.propertyType || 'Property'}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${propertyDetails.address || 'Location not specified'}</p>
                    <p class="price"><i class="fas fa-rupee-sign"></i> ${propertyDetails.price?.toLocaleString() || 'Price not specified'}</p>
                </div>
            </div>
            ${currentChat ? `<p class="seller-info">Chatting with: ${currentChat.sellerName}</p>` : ''}
        `;
    }

    async function sendMessage() {
        if (!messageInput.value.trim() || !selectedProperty || !currentUser) {
            console.log('Missing required data:', {
                message: messageInput.value.trim(),
                selectedProperty,
                currentUser
            });
            return;
        }
    
        const messageData = {
            propertyId: selectedProperty.id,
            senderId: currentUser._id,
            receiverId: selectedProperty.sellerId,
            message: messageInput.value.trim(),
            userType: currentUser.userType || 'buyer' // Add userType field
        };
    
        try {
            console.log('Sending message:', messageData);
            const response = await fetch('http://localhost:5000/api/property-chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }
    
            const data = await response.json();
            if (data.success) {
                appendMessage({
                    ...messageData,
                    timestamp: data.timestamp,
                    _id: data.messageId // Add message ID for deletion functionality
                }, true);
                messageInput.value = '';
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            showError(err.message || 'Failed to send message');
        }
    }

    function appendMessage(message, isSent) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        messageElement.dataset.messageId = message._id;
        
        if (isSent) {
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash delete-message';
            deleteIcon.title = 'Delete message';
            deleteIcon.onclick = () => confirmDeleteMessage(message._id);
            messageElement.appendChild(deleteIcon);
        }
        
        messageElement.appendChild(document.createTextNode(message.message));
        messagesContainer.appendChild(messageElement);
        
        // Improved scroll behavior
        requestAnimationFrame(() => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }

    function confirmDeleteMessage(messageId) {
        const modal = document.createElement('div');
        modal.className = 'delete-confirm-modal';
        modal.innerHTML = `
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message?</p>
            <div class="modal-buttons">
                <button class="cancel-delete">Cancel</button>
                <button class="confirm-delete">Delete</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    
        const confirmBtn = modal.querySelector('.confirm-delete');
        const cancelBtn = modal.querySelector('.cancel-delete');
    
        confirmBtn.onclick = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/property-chat/delete/${messageId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                
                if (data.success) {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        messageElement.remove();
                    }
                    modal.remove();
                } else {
                    showError('Failed to delete message');
                }
            } catch (err) {
                console.error('Error deleting message:', err);
                showError('Failed to delete message');
            }
        };
    
        cancelBtn.onclick = () => {
            modal.remove();
        };
    }

    async function loadExistingChat(propertyId, sellerId) {
        selectedProperty = {
            id: propertyId,
            sellerId: sellerId
        };
        
        messageInput.disabled = false;
        sendButton.disabled = false;
        
        await loadMessages(sellerId, propertyId);
    }

    function clearChat() {
        // Remove active class from all sellers
        document.querySelectorAll('.seller-item').forEach(item => {
            item.classList.remove('active');
        });
        
        messagesContainer.innerHTML = `
            <div class="no-chat-selected">
                <i class="fas fa-comments"></i>
                <p>Select a contact to start chatting</p>
            </div>
        `;
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    async function loadMessages(sellerId, propertyId) {
        try {
            showLoading();
            console.log('Loading messages for:', { sellerId, propertyId });
            
            const response = await fetch(`http://localhost:5000/api/property-chat/${propertyId}/${currentUser._id}/${sellerId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received messages:', data);
    
            if (data.success) {
                messagesContainer.innerHTML = '';
                updateChatHeader(data.propertyDetails);
    
                data.messages.forEach(msg => {
                    appendMessage(msg, msg.senderId._id === currentUser._id);
                });
    
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Enable input after successful load
                messageInput.disabled = false;
                sendButton.disabled = false;
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            showError('Failed to load messages');
        } finally {
            hideLoading();
        }
    }

    // Initialize chat
    initializeChat();
});
