// ГЛОБАЛЬНЫЕ КЛАССЫ И ПЕРЕМЕННЫЕ
class User {
    constructor(name, username, password, bio = '') {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.username = username;
        this.password = password;
        this.bio = bio || `${name} пользуется ConnectFlow`;
        this.avatar = null; // Будет хранить base64 аватара
        this.status = 'online';
        this.lastSeen = new Date().toISOString();
        this.friends = [];
        this.friendRequests = [];
        this.sentRequests = [];
        this.chats = [];
        this.createdAt = new Date().toISOString();
        
        // Настройки приватности
        this.privacySettings = {
            profileVisibility: 'public', // public, friends, private
            showOnlineStatus: true,
            allowFriendRequests: true,
            allowMessagesFrom: 'everyone', // everyone, friends, nobody
            showLastSeen: true
        };
    }
}

class FriendRequest {
    constructor(from, to, status = 'pending') {
        this.id = Date.now() + Math.random();
        this.from = from;
        this.to = to;
        this.status = status;
        this.createdAt = new Date().toISOString();
    }
}

class Chat {
    constructor(id, participants, messages = []) {
        this.id = id;
        this.participants = participants;
        this.messages = messages;
        this.lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        this.unreadCount = 0;
        this.createdAt = new Date().toISOString();
    }
}

class Message {
    constructor(sender, text, type = 'text') {
        this.id = Date.now() + Math.random();
        this.sender = sender;
        this.text = text;
        this.type = type;
        this.timestamp = new Date().toISOString();
        this.read = false;
    }
}

// ГЛОБАЛЬНОЕ СОСТОЯНИЕ
let currentUser = null;
let allUsers = {};
let allChats = {};
let friendRequests = [];

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    loadData();
    checkAuth();
    initAuthEvents();
    initNavigationEvents();
    initChatEvents();
    initFriendEvents();
    initSettingsEvents();
    initModalEvents();
    initAvatarUpload();
    
    if (Object.keys(allUsers).length === 0) {
        createDemoUsers();
    }
}

// РАБОТА С ДАННЫМИ
function loadData() {
    try {
        const usersData = localStorage.getItem('connectflow_users');
        const chatsData = localStorage.getItem('connectflow_chats');
        const requestsData = localStorage.getItem('connectflow_friend_requests');
        
        if (usersData) allUsers = JSON.parse(usersData);
        if (chatsData) allChats = JSON.parse(chatsData);
        if (requestsData) friendRequests = JSON.parse(requestsData);
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
        resetData();
    }
}

function saveData() {
    localStorage.setItem('connectflow_users', JSON.stringify(allUsers));
    localStorage.setItem('connectflow_chats', JSON.stringify(allChats));
    localStorage.setItem('connectflow_friend_requests', JSON.stringify(friendRequests));
}

function resetData() {
    allUsers = {};
    allChats = {};
    friendRequests = [];
    localStorage.clear();
    createDemoUsers();
}

function createDemoUsers() {
    const demoUsers = [
        new User('Алексей Волков', 'alex.volkov', '123456'),
        new User('Мария Смирнова', 'maria.s', '123456'),
        new User('Дмитрий Попов', 'dmitry_p', '123456'),
        new User('Екатерина Новикова', 'katya_n', '123456'),
        new User('Сергей Козлов', 'serg_kozlov', '123456'),
        new User('Ольга Морозова', 'olga_m', '123456'),
        new User('Иван Петров', 'ivan_petrov', '123456'),
        new User('Анна Сидорова', 'anna_s', '123456'),
        new User('Павел Иванов', 'pavel_i', '123456'),
        new User('Юлия Кузнецова', 'yulia_k', '123456')
    ];
    
    // Добавляем аватары для демо пользователей (цветные инициалы)
    demoUsers.forEach(user => {
        user.avatar = generateAvatar(user.name.charAt(0));
        allUsers[user.username] = user;
    });
    
    // Настраиваем приватность для демо пользователей
    allUsers['alex.volkov'].privacySettings.profileVisibility = 'private';
    allUsers['maria.s'].privacySettings.allowMessagesFrom = 'friends';
    allUsers['dmitry_p'].privacySettings.showOnlineStatus = false;
    
    saveData();
}

// РАБОТА С АВАТАРАМИ
function initAvatarUpload() {
    const avatarInput = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB
                    showNotification('Файл слишком большой (макс. 5MB)', 'error');
                    return;
                }
                
                if (!file.type.startsWith('image/')) {
                    showNotification('Пожалуйста, выберите изображение', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        // Создаем canvas для сжатия изображения
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Максимальные размеры
                        const maxWidth = 400;
                        const maxHeight = 400;
                        
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > maxWidth) {
                                height *= maxWidth / width;
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width *= maxHeight / height;
                                height = maxHeight;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Конвертируем в base64
                        const compressedAvatar = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // Обновляем аватар
                        currentUser.avatar = compressedAvatar;
                        allUsers[currentUser.username] = currentUser;
                        saveData();
                        updateUserInterface();
                        
                        // Обновляем превью
                        avatarPreview.innerHTML = `<img src="${compressedAvatar}" alt="Аватар">`;
                        
                        showNotification('Аватар успешно обновлен', 'success');
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function generateAvatar(letter) {
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    const color = colors[letter.charCodeAt(0) % colors.length];
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Фон
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 200);
    
    // Буква
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.toUpperCase(), 100, 100);
    
    return canvas.toDataURL();
}

// РЕАЛЬНЫЙ ПОИСК ПОЛЬЗОВАТЕЛЕЙ
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const searchType = e.target.dataset.searchType || 'all';
            
            if (searchTerm.length < 1) {
                resetSearchResults(searchType);
                return;
            }
            
            performSearch(searchTerm, searchType);
        }, 300));
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch(searchTerm, searchType) {
    const searchResults = [];
    
    Object.values(allUsers).forEach(user => {
        if (user.username === currentUser.username) return;
        
        // Проверяем настройки приватности
        const canSeeProfile = checkPrivacy(user, 'profileVisibility');
        if (!canSeeProfile) return;
        
        // Поиск по юзернейму, имени и биографии
        const matchesUsername = user.username.toLowerCase().includes(searchTerm);
        const matchesName = user.name.toLowerCase().includes(searchTerm);
        const matchesBio = user.bio.toLowerCase().includes(searchTerm);
        
        if (matchesUsername || matchesName || matchesBio) {
            // Релевантность поиска
            let relevance = 0;
            if (user.username.toLowerCase() === searchTerm) relevance += 10;
            if (user.username.toLowerCase().startsWith(searchTerm)) relevance += 5;
            if (matchesUsername) relevance += 3;
            if (matchesName) relevance += 2;
            if (matchesBio) relevance += 1;
            
            searchResults.push({ user, relevance });
        }
    });
    
    // Сортируем по релевантности
    searchResults.sort((a, b) => b.relevance - a.relevance);
    
    displaySearchResults(searchResults, searchType);
}

function displaySearchResults(results, searchType) {
    const containerId = {
        'users': 'users-list',
        'contacts': 'contacts-list',
        'chats': 'chats-list',
        'all': 'search-results'
    }[searchType];
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить запрос</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    results.forEach(({ user }) => {
        html += createUserSearchCard(user, searchType);
    });
    
    container.innerHTML = html;
    
    // Добавляем обработчики событий
    if (searchType === 'users') {
        document.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const username = this.dataset.username;
                sendFriendRequest(username);
            });
        });
    }
}

function createUserSearchCard(user, type) {
    const isFriend = currentUser.friends.includes(user.username);
    const requestSent = currentUser.sentRequests.includes(user.username);
    const hasRequest = user.friendRequests.includes(currentUser.username);
    
    let actionButton = '';
    
    if (type === 'users') {
        if (isFriend) {
            actionButton = `
                <button class="btn btn-success" onclick="startChatWith('${user.username}')">
                    <i class="fas fa-comment"></i> Написать
                </button>
            `;
        } else if (requestSent) {
            actionButton = `
                <button class="btn btn-outline" disabled>
                    <i class="fas fa-clock"></i> Заявка отправлена
                </button>
            `;
        } else if (hasRequest) {
            actionButton = `
                <button class="btn btn-success" onclick="acceptFriendRequestFromSearch('${user.username}')">
                    <i class="fas fa-user-plus"></i> Принять заявку
                </button>
            `;
        } else {
            actionButton = `
                <button class="btn btn-primary add-friend-btn" data-username="${user.username}">
                    <i class="fas fa-user-plus"></i> Добавить в друзья
                </button>
            `;
        }
    }
    
    return `
        <div class="contact-card">
            <div class="contact-card-header">
                <div class="user-avatar">
                    ${user.avatar ? 
                        `<img src="${user.avatar}" alt="${user.name}">` : 
                        user.name.charAt(0)
                    }
                    <div class="status-badge ${getStatusClass(user.status)}"></div>
                </div>
                <div class="contact-info">
                    <div class="contact-name">${user.name}</div>
                    <div class="contact-username">@${user.username}</div>
                    <div class="contact-status">${user.bio || 'Нет описания'}</div>
                    <div class="privacy-badge privacy-${user.privacySettings.profileVisibility}">
                        <i class="fas fa-${getPrivacyIcon(user.privacySettings.profileVisibility)}"></i>
                        ${getPrivacyText(user.privacySettings.profileVisibility)}
                    </div>
                </div>
            </div>
            <div class="contact-actions">
                ${actionButton}
                <button class="btn btn-outline" onclick="viewUserProfile('${user.username}')">
                    <i class="fas fa-eye"></i> Профиль
                </button>
            </div>
        </div>
    `;
}

function getPrivacyIcon(privacy) {
    switch(privacy) {
        case 'public': return 'globe';
        case 'friends': return 'user-friends';
        case 'private': return 'lock';
        default: return 'question';
    }
}

function getPrivacyText(privacy) {
    switch(privacy) {
        case 'public': return 'Публичный';
        case 'friends': return 'Только друзья';
        case 'private': return 'Приватный';
        default: return privacy;
    }
}

// ПРОВЕРКА ПРИВАТНОСТИ
function checkPrivacy(user, setting) {
    if (!user || !user.privacySettings) return true;
    
    const privacy = user.privacySettings[setting];
    
    switch(privacy) {
        case 'public':
            return true;
        case 'friends':
            return user.friends.includes(currentUser.username);
        case 'private':
            return false;
        case 'everyone':
            return true;
        case 'nobody':
            return false;
        default:
            return true;
    }
}

function canSendMessage(toUser) {
    return checkPrivacy(toUser, 'allowMessagesFrom');
}

function canSendFriendRequest(toUser) {
    return checkPrivacy(toUser, 'allowFriendRequests');
}

function canViewProfile(user) {
    return checkPrivacy(user, 'profileVisibility');
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА С УЧЕТОМ ПРИВАТНОСТИ
function updateUserInterface() {
    if (!currentUser) return;
    
    // Основная информация
    document.getElementById('current-user-name').textContent = currentUser.name;
    document.getElementById('current-user-username').textContent = '@' + currentUser.username;
    
    // Аватар
    const avatarElement = document.getElementById('current-user-avatar');
    if (currentUser.avatar) {
        avatarElement.innerHTML = `<img src="${currentUser.avatar}" alt="${currentUser.name}">`;
    } else {
        avatarElement.textContent = currentUser.name.charAt(0);
        if (!avatarElement.style.background) {
            avatarElement.style.background = getComputedStyle(document.documentElement)
                .getPropertyValue('--gradient');
        }
    }
    
    // Статус
    const statusBadge = document.createElement('div');
    statusBadge.className = `status-badge ${getStatusClass(currentUser.status)}`;
    avatarElement.appendChild(statusBadge);
    
    // Настройки приватности в форме
    const privacySettings = currentUser.privacySettings;
    document.getElementById('privacy-profile').value = privacySettings.profileVisibility;
    document.getElementById('privacy-online').checked = privacySettings.showOnlineStatus;
    document.getElementById('privacy-friend-requests').checked = privacySettings.allowFriendRequests;
    document.getElementById('privacy-messages').value = privacySettings.allowMessagesFrom;
    document.getElementById('privacy-last-seen').checked = privacySettings.showLastSeen;
    
    // Информация в профиле
    document.getElementById('profile-name').value = currentUser.name;
    document.getElementById('profile-username').value = currentUser.username;
    document.getElementById('profile-bio').value = currentUser.bio || '';
    
    // Превью аватара в настройках
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
        if (currentUser.avatar) {
            avatarPreview.innerHTML = `<img src="${currentUser.avatar}" alt="Аватар">`;
        } else {
            avatarPreview.innerHTML = `<div style="width: 100%; height: 100%; background: var(--gradient); display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; font-weight: bold;">${currentUser.name.charAt(0)}</div>`;
        }
    }
}

// СОХРАНЕНИЕ НАСТРОЕК ПРИВАТНОСТИ
function savePrivacySettings() {
    if (!currentUser) return;
    
    currentUser.privacySettings = {
        profileVisibility: document.getElementById('privacy-profile').value,
        showOnlineStatus: document.getElementById('privacy-online').checked,
        allowFriendRequests: document.getElementById('privacy-friend-requests').checked,
        allowMessagesFrom: document.getElementById('privacy-messages').value,
        showLastSeen: document.getElementById('privacy-last-seen').checked
    };
    
    allUsers[currentUser.username] = currentUser;
    saveData();
    
    showNotification('Настройки приватности сохранены', 'success');
}

// УЛУЧШЕННАЯ РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ
function registerUser() {
    const name = document.getElementById('register-name').value.trim();
    const username = document.getElementById('register-username').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    resetErrors('register');
    
    // Валидация
    if (!name || name.length < 2) {
        showError('register-name-error', 'Введите имя (минимум 2 символа)');
        return;
    }
    
    if (!username || username.length < 3) {
        showError('register-username-error', 'Юзернейм должен быть от 3 символов');
        return;
    }
    
    if (!/^[a-z0-9._]+$/.test(username)) {
        showError('register-username-error', 'Только латинские буквы, цифры, . и _');
        return;
    }
    
    if (allUsers[username]) {
        showError('register-username-error', 'Этот юзернейм уже занят');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('register-password-error', 'Пароль должен быть от 6 символов');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('register-confirm-error', 'Пароли не совпадают');
        return;
    }
    
    // Создание пользователя
    const newUser = new User(name, username, password);
    newUser.avatar = generateAvatar(name.charAt(0));
    allUsers[username] = newUser;
    currentUser = newUser;
    
    localStorage.setItem('connectflow_current_user', JSON.stringify(currentUser));
    saveData();
    
    showApp();
    showNotification('Добро пожаловать в ConnectFlow!', 'success');
}

// УТИЛИТЫ
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'shake 0.5s ease';
    }
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Автоматическое закрытие
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function getStatusClass(status) {
    switch(status) {
        case 'online': return 'status-online';
        case 'offline': return 'status-offline';
        case 'away': return 'status-away';
        case 'dnd': return 'status-dnd';
        default: return 'status-offline';
    }
}

// ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ (дополнительные функции)
function initAuthEvents() {
    // ... существующий код ...
    
    // Добавляем валидацию в реальном времени
    document.getElementById('register-username').addEventListener('input', function() {
        const username = this.value.trim().toLowerCase();
        const errorElement = document.getElementById('register-username-error');
        
        if (username.length < 3) {
            showError('register-username-error', 'Минимум 3 символа');
        } else if (!/^[a-z0-9._]+$/.test(username)) {
            showError('register-username-error', 'Только латинские буквы, цифры, . и _');
        } else if (allUsers[username]) {
            showError('register-username-error', 'Юзернейм занят');
        } else {
            errorElement.style.display = 'none';
        }
    });
}

function initSettingsEvents() {
    // ... существующий код ...
    
    // Сохранение настроек приватности
    document.querySelectorAll('#privacy-section select, #privacy-section input[type="checkbox"]').forEach(element => {
        element.addEventListener('change', debounce(savePrivacySettings, 500));
    });
}

// ДОПОЛНИТЕЛЬНЫЕ АНИМАЦИИ CSS (добавить в style.css)
const additionalStyles = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
}

.notification {
    animation: slideInRight 0.3s ease;
}

.notification.fade-out {
    animation: fadeOut 0.3s ease;
}
`;

// Добавляем дополнительные стили
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Экспорт функций для использования в HTML
window.acceptFriendRequestFromSearch = function(username) {
    const user = allUsers[username];
    if (user && user.friendRequests.includes(currentUser.username)) {
        // Находим заявку
        const request = friendRequests.find(req => 
            req.from === username && req.to === currentUser.username && req.status === 'pending'
        );
        
        if (request) {
            acceptFriendRequest(request.id);
        }
    }
};

window.viewUserProfile = function(username) {
    const user = allUsers[username];
    if (!user || !canViewProfile(user)) {
        showNotification('Профиль пользователя скрыт', 'warning');
        return;
    }
    
    showUserProfileModal(user);
};

window.removeFriend = function(username) {
    if (confirm(`Удалить ${username} из друзей?`)) {
        // ... существующий код ...
    }
};

window.startChatWith = function(username) {
    const user = allUsers[username];
    if (!user || !canSendMessage(user)) {
        showNotification('Пользователь запретил получать сообщения', 'error');
        return;
    }
    
    // ... существующий код ...
};

// ИНИЦИАЛИЗАЦИЯ ПОИСКА
initSearch();