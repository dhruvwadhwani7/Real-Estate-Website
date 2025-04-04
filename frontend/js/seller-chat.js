document.addEventListener('DOMContentLoaded', function() {
    const buyersList = document.querySelector('.buyers-list');
    const chatMessages = document.querySelector('.chat-messages');
    const messageInput = document.querySelector('.chat-input-area input');
    const sendButton = document.querySelector('.send-btn');
    let currentSeller = JSON.parse(localStorage.getItem('userData'));
    let currentBuyerId = null;
    let currentPropertyId = null;

    async function loadBuyerInquiries() {
        try {
            if (!currentSeller || !currentSeller._id) {
                showError('User session not found. Please login again.');
                return;
            }

            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading inquiries...';
            buyersList.appendChild(loadingDiv);

            const response = await fetch(`http://localhost:5000/api/seller/buyer-inquiries/${currentSeller._id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.inquiries)) {
                displayBuyerInquiries(data.inquiries);
            } else {
                throw new Error(data.message || 'Failed to load inquiries');
            }
        } catch (err) {
            console.error('Error loading inquiries:', err);
            buyersList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load inquiries</p>
                    <button onclick="window.location.reload()">Retry</button>
                </div>`;
        } finally {
            const loadingIndicator = buyersList.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    function displayBuyerInquiries(inquiries) {
        if (!Array.isArray(inquiries) || inquiries.length === 0) {
            buyersList.innerHTML = `
                <div class="no-inquiries-message">
                    <i class="fas fa-inbox"></i>
                    <p>No inquiries yet</p>
                </div>`;
            return;
        }

        buyersList.innerHTML = inquiries.map(inquiry => `
            <div class="buyer-item ${currentBuyerId === inquiry.buyerId ? 'active' : ''}" 
                 data-buyer-id="${inquiry.buyerId}" 
                 data-property-id="${inquiry.propertyId}">
                <img src="../../img/images/arrow.png" alt="Buyer">
                <div class="buyer-info">
                    <h4>${inquiry.buyerName || 'Unknown Buyer'}</h4>
                    <p class="property-type">
                        <i class="fas fa-home"></i> ${inquiry.propertyType || 'Property'}
                    </p>
                    <p class="property-address">
                        <i class="fas fa-map-marker-alt"></i> ${inquiry.propertyAddress || 'No address'}
                    </p>
                    <p class="last-message" title="${inquiry.lastMessage}">
                        ${inquiry.lastMessage?.substring(0, 30)}${inquiry.lastMessage?.length > 30 ? '...' : ''}
                    </p>
                    <div class="message-meta">
                        <span class="message-count">
                            <i class="fas fa-envelope"></i> ${inquiry.messageCount}
                        </span>
                        <span class="message-time">
                            ${formatTimestamp(inquiry.lastTimestamp)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.buyer-item').forEach(item => {
            item.addEventListener('click', () => selectBuyer(item));
        });
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    async function selectBuyer(buyerItem) {
        currentBuyerId = buyerItem.dataset.buyerId;
        currentPropertyId = buyerItem.dataset.propertyId;

        // Update UI active state
        document.querySelectorAll('.buyer-item').forEach(item => {
            item.classList.remove('active');
        });
        buyerItem.classList.add('active');

        // Enable chat input
        messageInput.disabled = false;
        sendButton.disabled = false;

        // Load chat history
        await loadChatHistory();
    }

    async function loadChatHistory() {
        if (!currentPropertyId || !currentSeller?._id || !currentBuyerId) {
            showError('Missing required information for chat');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/property-chat/${currentPropertyId}/${currentSeller._id}/${currentBuyerId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load chat history');
            }

            if (data.success) {
                displayMessages(data.messages);
                updateChatHeader(data.propertyDetails);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error('Error loading chat history:', err);
            showError('Failed to load chat history');
        }
    }

    function displayMessages(messages) {
        chatMessages.innerHTML = messages.map(msg => {
            const isSeller = msg.senderId._id === currentSeller._id;
            const messageClass = isSeller ? 'sent' : 'received';
            const senderName = isSeller ? 'You' : (msg.senderId.fullName || 'Buyer');
            
            return `
                <div class="message ${messageClass}" data-message-id="${msg._id}">
                    <span class="sender-name">${senderName}</span>
                    <div class="message-content">
                        ${msg.message}
                        ${isSeller ? '<i class="fas fa-trash delete-message" onclick="handleDeleteMessage(\''+msg._id+'\')"></i>' : ''}
                    </div>
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            `;
        }).join('');

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add delete message handling
    window.handleDeleteMessage = async function(messageId) {
        const deleteModal = document.getElementById('deleteMessageModal');
        const confirmBtn = deleteModal.querySelector('.confirm-delete');
        const cancelBtn = deleteModal.querySelector('.cancel-delete');

        // Show modal
        deleteModal.classList.add('show');
        deleteModal.style.display = 'block';

        // Handle delete confirmation
        const handleConfirm = async () => {
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
                    showError('Message deleted successfully');
                }
            } catch (err) {
                console.error('Error deleting message:', err);
                showError('Failed to delete message');
            } finally {
                closeDeleteModal();
            }
        };

        // Handle cancel
        const handleCancel = () => {
            closeDeleteModal();
        };

        // Add event listeners
        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
    };

    function closeDeleteModal() {
        const deleteModal = document.getElementById('deleteMessageModal');
        deleteModal.classList.remove('show');
        setTimeout(() => {
            deleteModal.style.display = 'none';
        }, 300);
    }

    // Add global click handler to close modal on outside click
    document.addEventListener('click', (e) => {
        const deleteModal = document.getElementById('deleteMessageModal');
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    async function sendMessage() {
        if (!messageInput.value.trim()) {
            showError('Please enter a message');
            return;
        }

        if (!currentBuyerId || !currentPropertyId) {
            showError('Please select a chat first');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/property-chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    propertyId: currentPropertyId,
                    senderId: currentSeller._id,
                    receiverId: currentBuyerId,
                    message: messageInput.value.trim(),
                    userType: 'seller'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message');
            }

            if (data.success) {
                messageInput.value = '';
                await loadChatHistory();
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            showError(err.message || 'Failed to send message');
        }
    }

    function updateChatHeader(propertyDetails) {
        const chatHeader = document.querySelector('.chat-header');
        if (!propertyDetails) return;

        chatHeader.innerHTML = `
            <div class="current-chat-info">
                <img src="../../img/images/arrow.png" alt="Profile" class="chat-profile-img">
                <div class="chat-user-info">
                    <h3>${propertyDetails.propertyType}</h3>
                    <p class="status">${propertyDetails.address}</p>
                </div>
            </div>
            <div class="property-details">
                <img src="${propertyDetails.imageLink || '../../img/images/arrow.png'}" 
                     alt="Property" 
                     onerror="this.src='../../img/images/arrow.png'">
                <div class="price">₹${Number(propertyDetails.price).toLocaleString()}</div>
            </div>
        `;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
    });

    // Initialize
    loadBuyerInquiries();
});
