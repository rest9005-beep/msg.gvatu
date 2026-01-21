// ГЛОБАЛЬНЫЕ КЛАССЫ И ПЕРЕМЕННЫЕ
class User {
    constructor(name, username, password, bio = '') {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.username = username;
        this.password = password;
        this.bio = bio || `${name} пользуется ConnectFlow`;
        this.avatar = null;
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
    console.log('Инициализация приложения...');
    
    // Загружаем данные
    loadData();
    
    // Проверяем авторизацию (исправленная функция)
    checkAuth();
    
    // Инициализируем события
    initAuthEvents();
    initNavigationEvents();
    initSearch();
    initSettingsEvents();
    
    // Загружаем демо-данные, если нет пользователей
    if (Object.keys(allUsers).length === 0) {
        console.log('Создание демо пользователей...');
        createDemoUsers();
    }
    
    console.log('Приложение инициализировано');
}

// РАБОТА С ДАННЫМИ
function loadData() {
    try {
        const usersData = localStorage.getItem('connectflow_users');
        const chatsData = localStorage.getItem('connectflow_chats');
        const requestsData = localStorage.getItem('connectflow_friend_requests');
        
        if (usersData) {
            allUsers = JSON.parse(usersData);
            console.log('Загружено пользователей:', Object.keys(allUsers).length);
        }
        
        if (chatsData) {
            allChats = JSON.parse(chatsData);
            console.log('Загружено чатов:', Object.keys(allChats).length);
        }
        
        if (requestsData) {
            friendRequests = JSON.parse(requestsData);
            console.log('Загружено заявок:', friendRequests.length);
        }
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

// ФУНКЦИЯ checkAuth, КОТОРОЙ НЕ ХВАТАЛО
function checkAuth() {
    try {
        const userData = localStorage.getItem('connectflow_current_user');
        if (userData) {
            currentUser = JSON.parse(userData);
            console.log('Пользователь авторизован:', currentUser.username);
            
            // Проверяем, что пользователь существует в allUsers
            if (!allUsers[currentUser.username]) {
                console.warn('Пользователь не найден в allUsers, добавляем...');
                allUsers[currentUser.username] = currentUser;
                saveData();
            }
            
            showApp();
            return true;
        }
        return false;
    } catch (e) {
        console.error('Ошибка проверки авторизации:', e);
        return false;
    }
}

function createDemoUsers() {
    console.log('Создание демо пользователей...');
    
    const demoUsers = [
        new User('Алексей Волков', 'alex.volkov', '123456'),
        new User('Мария Смирнова', 'maria.s', '123456'),
        new User('Дмитрий Попов', 'dmitry_p', '123456'),
        new User('Екатерина Новикова', 'katya_n', '123456'),
        new User('Сергей Козлов', 'serg_kozlov', '123456'),
        new User('Ольга Морозова', 'olga_m', '123456'),
        new User('Иван Петров', 'ivan_petrov', '123456'),
        new User('Анна Сидорова', 'anna_s', '123456')
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
    
    // Создаем тестовые чаты
    const chat1 = new Chat('1', ['alex.volkov', 'maria.s'], [
        new Message('alex.volkov', 'Привет! Как дела?'),
        new Message('maria.s', 'Привет! Всё отлично, спасибо!'),
        new Message('alex.volkov', 'Отлично! Готов к встрече?')
    ]);
    
    const chat2 = new Chat('2', ['dmitry_p', 'katya_n', 'serg_kozlov'], [
        new Message('dmitry_p', 'Всем привет!'),
        new Message('katya_n', 'Привет!'),
        new Message('serg_kozlov', 'Здравствуйте!')
    ]);
    
    allChats['1'] = chat1;
    allChats['2'] = chat2;
    
    // Создаем тестовые заявки в друзья
    const request1 = new FriendRequest('alex.volkov', 'maria.s', 'pending');
    const request2 = new FriendRequest('dmitry_p', 'katya_n', 'accepted');
    
    friendRequests.push(request1, request2);
    
    // Обновляем списки друзей
    allUsers['maria.s'].friendRequests.push('alex.volkov');
    allUsers['alex.volkov'].sentRequests.push('maria.s');
    
    allUsers['katya_n'].friends.push('dmitry_p');
    allUsers['dmitry_p'].friends.push('katya_n');
    
    saveData();
    console.log('Создано демо пользователей:', demoUsers.length);
}

// РАБОТА С АВАТАРАМИ
function generateAvatar(letter) {
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    const color = colors[letter.charCodeAt(0) % colors.length];
    
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Фон
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 100, 100);
    
    // Буква
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.toUpperCase(), 50, 50);
    
    return canvas.toDataURL();
}

function initAvatarUpload() {
    const avatarInput = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Файл слишком большой (макс. 5MB)', 'error');
                    return;
                }
                
                if (!file.type.startsWith('image/')) {
                    showNotification('Пожалуйста, выберите изображение', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Обновляем аватар
                    currentUser.avatar = e.target.result;
                    allUsers[currentUser.username] = currentUser;
                    saveData();
                    updateUserInterface();
                    
                    // Обновляем превью
                    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Аватар" style="width:100%;height:100%;object-fit:cover;">`;
                    
                    showNotification('Аватар успешно обновлен', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// АВТОРИЗАЦИЯ
function initAuthEvents() {
    console.log('Инициализация событий авторизации...');
    
    // Переключение вкладок авторизации
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabId}-form`).classList.add('active');
        });
    });

    // Переход между формами
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    
    if (goToRegister) {
        goToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.auth-tab[data-tab="register"]').click();
        });
    }
    
    if (goToLogin) {
        goToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.auth-tab[data-tab="login"]').click();
        });
    }

    // Форма входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginUser();
        });
    }

    // Форма регистрации
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registerUser();
        });
    }
}

function loginUser() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    resetErrors('login');
    
    if (!username) {
        showError('login-username-error', 'Введите юзернейм');
        return;
    }
    
    if (!password) {
        showError('login-password-error', 'Введите пароль');
        return;
    }
    
    const user = allUsers[username];
    
    if (!user) {
        showError('login-password-error', 'Пользователь не найден');
        return;
    }
    
    if (user.password !== password) {
        showError('login-password-error', 'Неверный пароль');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('connectflow_current_user', JSON.stringify(currentUser));
    showApp();
    showNotification('Успешный вход!', 'success');
}

function registerUser() {
    const name = document.getElementById('register-name').value.trim();
    const username = document.getElementById('register-username').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    resetErrors('register');
    
    let isValid = true;
    
    if (!name) {
        showError('register-name-error', 'Введите имя');
        isValid = false;
    }
    
    if (!username) {
        showError('register-username-error', 'Введите юзернейм');
        isValid = false;
    } else if (username.length < 3) {
        showError('register-username-error', 'Юзернейм должен быть не менее 3 символов');
        isValid = false;
    } else if (!/^[a-z0-9._]+$/.test(username)) {
        showError('register-username-error', 'Только латинские буквы, цифры, точки и подчеркивания');
        isValid = false;
    } else if (allUsers[username]) {
        showError('register-username-error', 'Пользователь с таким юзернеймом уже существует');
        isValid = false;
    }
    
    if (!password) {
        showError('register-password-error', 'Введите пароль');
        isValid = false;
    } else if (password.length < 6) {
        showError('register-password-error', 'Пароль должен быть не менее 6 символов');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('register-confirm-error', 'Пароли не совпадают');
        isValid = false;
    }
    
    if (!isValid) return;
    
    const newUser = new User(name, username, password);
    newUser.avatar = generateAvatar(name.charAt(0));
    allUsers[username] = newUser;
    currentUser = newUser;
    
    localStorage.setItem('connectflow_current_user', JSON.stringify(currentUser));
    saveData();
    
    showApp();
    showNotification('Аккаунт успешно создан!', 'success');
}

function showApp() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    updateUserInterface();
    loadPage('chats');
    initAvatarUpload();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('connectflow_current_user');
    
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    
    // Сбрасываем формы
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    showNotification('Вы вышли из аккаунта', 'info');
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function updateUserInterface() {
    if (!currentUser) return;
    
    console.log('Обновление интерфейса для пользователя:', currentUser.username);
    
    // Основная информация
    const userNameElement = document.getElementById('current-user-name');
    const userUsernameElement = document.getElementById('current-user-username');
    const userAvatarElement = document.getElementById('current-user-avatar');
    
    if (userNameElement) userNameElement.textContent = currentUser.name;
    if (userUsernameElement) userUsernameElement.textContent = '@' + currentUser.username;
    
    if (userAvatarElement) {
        if (currentUser.avatar) {
            userAvatarElement.innerHTML = `<img src="${currentUser.avatar}" alt="${currentUser.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
        } else {
            userAvatarElement.textContent = currentUser.name.charAt(0);
            userAvatarElement.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
            userAvatarElement.style.display = 'flex';
            userAvatarElement.style.alignItems = 'center';
            userAvatarElement.style.justifyContent = 'center';
            userAvatarElement.style.color = 'white';
            userAvatarElement.style.fontWeight = 'bold';
            userAvatarElement.style.fontSize = '20px';
        }
    }
    
    // Информация в профиле
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileBio = document.getElementById('profile-bio');
    
    if (profileName) profileName.value = currentUser.name;
    if (profileUsername) profileUsername.value = currentUser.username;
    if (profileBio) profileBio.value = currentUser.bio || '';
    
    // Превью аватара в настройках
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
        if (currentUser.avatar) {
            avatarPreview.innerHTML = `<img src="${currentUser.avatar}" alt="Аватар" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            avatarPreview.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);display:flex;align-items:center;justify-content:center;color:white;font-size:40px;font-weight:bold;">${currentUser.name.charAt(0)}</div>`;
        }
    }
    
    // Настройки приватности
    if (currentUser.privacySettings) {
        const privacyProfile = document.getElementById('privacy-profile');
        const privacyOnline = document.getElementById('privacy-online');
        const privacyFriendRequests = document.getElementById('privacy-friend-requests');
        const privacyMessages = document.getElementById('privacy-messages');
        const privacyLastSeen = document.getElementById('privacy-last-seen');
        
        if (privacyProfile) privacyProfile.value = currentUser.privacySettings.profileVisibility || 'public';
        if (privacyOnline) privacyOnline.checked = currentUser.privacySettings.showOnlineStatus !== false;
        if (privacyFriendRequests) privacyFriendRequests.checked = currentUser.privacySettings.allowFriendRequests !== false;
        if (privacyMessages) privacyMessages.value = currentUser.privacySettings.allowMessagesFrom || 'everyone';
        if (privacyLastSeen) privacyLastSeen.checked = currentUser.privacySettings.showLastSeen !== false;
    }
}

// НАВИГАЦИЯ
function initNavigationEvents() {
    console.log('Инициализация навигации...');
    
    // Переключение страниц
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            loadPage(page);
        });
    });
    
    // Переключение вкладок друзей
    document.querySelectorAll('.friends-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.friends-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabContent = document.getElementById(`${tabId}-tab`);
            if (tabContent) tabContent.classList.add('active');
            
            loadFriendsTab(tabId);
        });
    });
    
    // Переключение разделов настроек
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            document.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.settings-section').forEach(sec => {
                sec.classList.remove('active');
            });
            
            const sectionContent = document.getElementById(`${section}-section`);
            if (sectionContent) sectionContent.classList.add('active');
        });
    });
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Кнопки верхней панели
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', function() {
            const searchBox = document.getElementById('chats-search-box');
            if (searchBox) {
                searchBox.style.display = searchBox.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            showNewChatModal();
        });
    }
}

function loadPage(page) {
    console.log('Загрузка страницы:', page);
    
    // Обновляем заголовок
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        const titles = {
            'chats': 'Чаты',
            'contacts': 'Контакты',
            'friends': 'Друзья',
            'settings': 'Настройки'
        };
        pageTitle.textContent = titles[page] || page;
    }
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Показываем нужную страницу
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Загружаем контент страницы
    switch(page) {
        case 'chats':
            loadChats();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'friends':
            loadFriendsTab('requests');
            break;
        case 'settings':
            // Настройки уже загружены
            break;
    }
}

// ПОИСК
function initSearch() {
    console.log('Инициализация поиска...');
    
    // Поиск чатов
    const chatsSearch = document.getElementById('chats-search');
    if (chatsSearch) {
        chatsSearch.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            performSearch(searchTerm, 'chats');
        }, 300));
    }
    
    // Поиск контактов
    const contactsSearch = document.getElementById('contacts-search');
    if (contactsSearch) {
        contactsSearch.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            performSearch(searchTerm, 'contacts');
        }, 300));
    }
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
    console.log('Поиск:', searchTerm, searchType);
    
    if (searchTerm.length < 1) {
        resetSearchResults(searchType);
        return;
    }
    
    const searchResults = [];
    
    Object.values(allUsers).forEach(user => {
        if (user.username === currentUser.username) return;
        
        // Проверяем настройки приватности
        if (!checkPrivacy(user, 'profileVisibility')) return;
        
        // Поиск по юзернейму, имени и биографии
        const matchesUsername = user.username.toLowerCase().includes(searchTerm);
        const matchesName = user.name.toLowerCase().includes(searchTerm);
        const matchesBio = (user.bio || '').toLowerCase().includes(searchTerm);
        
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
    console.log('Отображение результатов поиска:', results.length, searchType);
    
    const containerId = {
        'chats': 'chats-list',
        'contacts': 'users-list',
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
    if (searchType === 'contacts') {
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
    
    if (type === 'contacts') {
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
                        `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
                        user.name.charAt(0)
                    }
                </div>
                <div class="contact-info">
                    <div class="contact-name">${user.name}</div>
                    <div class="contact-username">@${user.username}</div>
                    <div class="contact-status">${user.bio || 'Нет описания'}</div>
                </div>
            </div>
            <div class="contact-actions">
                ${actionButton}
            </div>
        </div>
    `;
}

function resetSearchResults(searchType) {
    const containerId = {
        'chats': 'chats-list',
        'contacts': 'users-list'
    }[searchType];
    
    const container = document.getElementById(containerId);
    if (container) {
        if (searchType === 'chats') {
            loadChats();
        } else if (searchType === 'contacts') {
            loadUsersToAdd();
        }
    }
}

// ЧАТЫ
function loadChats() {
    const container = document.getElementById('chats-list');
    if (!container) return;
    
    // Фильтруем чаты текущего пользователя
    const userChats = Object.values(allChats).filter(chat => 
        chat.participants.includes(currentUser.username)
    );
    
    if (userChats.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment"></i>
                <h3>Нет чатов</h3>
                <p>Начните общение, создав новый чат</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    userChats.forEach(chat => {
        // Получаем имя собеседника
        const otherParticipant = chat.participants.find(p => p !== currentUser.username);
        const otherUser = allUsers[otherParticipant];
        const name = otherUser ? otherUser.name : 'Неизвестный пользователь';
        const avatar = otherUser ? (otherUser.avatar ? 
            `<img src="${otherUser.avatar}" alt="${name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
            otherUser.name.charAt(0)) : '?';
        const lastMessage = chat.lastMessage ? chat.lastMessage.text : 'Нет сообщений';
        const time = chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : '';
        
        html += `
            <div class="chat-card" data-chat-id="${chat.id}">
                <div class="chat-card-header">
                    <div class="chat-card-avatar">${avatar}</div>
                    <div class="chat-card-info">
                        <div class="chat-card-name">${name}</div>
                        <div class="chat-card-time">${time}</div>
                    </div>
                </div>
                <div class="chat-card-preview">${lastMessage}</div>
                <div class="chat-card-actions">
                    <button class="btn btn-outline" onclick="openChat('${chat.id}')">
                        Открыть
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openChat(chatId) {
    showNotification(`Открытие чата ${chatId}`, 'info');
}

function startChatWith(username) {
    const user = allUsers[username];
    if (!user) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    if (!canSendMessage(user)) {
        showNotification('Пользователь запретил получать сообщения', 'error');
        return;
    }
    
    // Создаем или находим чат
    const existingChat = Object.values(allChats).find(chat => 
        chat.participants.includes(currentUser.username) && 
        chat.participants.includes(username) &&
        chat.participants.length === 2
    );
    
    if (existingChat) {
        openChat(existingChat.id);
    } else {
        const chatId = Date.now().toString();
        const newChat = new Chat(chatId, [currentUser.username, username], [
            new Message(currentUser.username, `Привет! Я ${currentUser.name}`)
        ]);
        allChats[chatId] = newChat;
        saveData();
        
        openChat(chatId);
        loadChats();
    }
}

// КОНТАКТЫ
function loadContacts() {
    const container = document.getElementById('contacts-list');
    if (!container) return;
    
    // Получаем друзей текущего пользователя
    const friends = currentUser.friends || [];
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Нет контактов</h3>
                <p>Добавьте друзей, чтобы начать общение</p>
            </div>
        `;
    } else {
        let html = '';
        friends.forEach(username => {
            const user = allUsers[username];
            if (user) {
                html += createContactCard(user);
            }
        });
        container.innerHTML = html;
    }
    
    // Загружаем пользователей для добавления
    loadUsersToAdd();
}

function createContactCard(user) {
    return `
        <div class="contact-card">
            <div class="contact-card-header">
                <div class="user-avatar">
                    ${user.avatar ? 
                        `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
                        user.name.charAt(0)
                    }
                </div>
                <div class="contact-info">
                    <div class="contact-name">${user.name}</div>
                    <div class="contact-username">@${user.username}</div>
                </div>
            </div>
            <div class="contact-actions">
                <button class="btn btn-primary" onclick="startChatWith('${user.username}')">
                    Написать
                </button>
                <button class="btn btn-danger" onclick="removeFriend('${user.username}')">
                    Удалить
                </button>
            </div>
        </div>
    `;
}

function loadUsersToAdd() {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    // Фильтруем пользователей, исключая текущего и его друзей
    const filteredUsers = Object.values(allUsers).filter(user => 
        user.username !== currentUser.username && 
        !currentUser.friends.includes(user.username)
    );
    
    if (filteredUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Нет пользователей</h3>
                <p>Все пользователи уже в ваших контактах</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredUsers.forEach(user => {
        const isRequestSent = currentUser.sentRequests.includes(user.username);
        const hasRequest = user.friendRequests.includes(currentUser.username);
        
        let buttonText = 'Добавить в друзья';
        let buttonClass = 'btn-primary';
        let buttonDisabled = false;
        let onclick = `sendFriendRequest('${user.username}')`;
        
        if (isRequestSent) {
            buttonText = 'Заявка отправлена';
            buttonClass = 'btn-outline';
            buttonDisabled = true;
            onclick = '';
        } else if (hasRequest) {
            buttonText = 'Принять заявку';
            buttonClass = 'btn-success';
            onclick = `acceptFriendRequestFromSearch('${user.username}')`;
        }
        
        html += `
            <div class="contact-card">
                <div class="contact-card-header">
                    <div class="user-avatar">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
                            user.name.charAt(0)
                        }
                    </div>
                    <div class="contact-info">
                        <div class="contact-name">${user.name}</div>
                        <div class="contact-username">@${user.username}</div>
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="btn ${buttonClass}" ${buttonDisabled ? 'disabled' : ''} onclick="${onclick}">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ДРУЗЬЯ
function sendFriendRequest(toUsername) {
    const toUser = allUsers[toUsername];
    if (!toUser) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    if (!canSendFriendRequest(toUser)) {
        showNotification('Пользователь запретил заявки в друзья', 'error');
        return;
    }
    
    const request = new FriendRequest(currentUser.username, toUsername);
    friendRequests.push(request);
    
    // Обновляем данные пользователей
    if (!currentUser.sentRequests.includes(toUsername)) {
        currentUser.sentRequests.push(toUsername);
    }
    
    if (!toUser.friendRequests.includes(currentUser.username)) {
        toUser.friendRequests.push(currentUser.username);
    }
    
    allUsers[currentUser.username] = currentUser;
    allUsers[toUsername] = toUser;
    saveData();
    
    showNotification(`Заявка отправлена @${toUsername}`, 'success');
    loadUsersToAdd();
}

function loadFriendsTab(tab) {
    console.log('Загрузка вкладки друзей:', tab);
    
    switch(tab) {
        case 'requests':
            loadFriendRequests();
            break;
        case 'friends':
            loadFriendsList();
            break;
        case 'sent':
            loadSentRequests();
            break;
    }
}

function loadFriendRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;
    
    // Получаем входящие заявки
    const incomingRequests = friendRequests.filter(req => 
        req.to === currentUser.username && req.status === 'pending'
    );
    
    if (incomingRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>Нет заявок</h3>
                <p>У вас нет входящих заявок в друзья</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    incomingRequests.forEach(request => {
        const fromUser = allUsers[request.from];
        if (fromUser) {
            html += `
                <div class="request-item" data-request-id="${request.id}">
                    <div class="user-avatar" style="width:48px;height:48px;">
                        ${fromUser.avatar ? 
                            `<img src="${fromUser.avatar}" alt="${fromUser.name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
                            fromUser.name.charAt(0)
                        }
                    </div>
                    <div class="request-info">
                        <div class="request-name">${fromUser.name}</div>
                        <div class="request-username">@${fromUser.username}</div>
                        <div class="request-actions">
                            <button class="btn btn-success" onclick="acceptFriendRequest('${request.id}')">
                                Принять
                            </button>
                            <button class="btn btn-danger" onclick="rejectFriendRequest('${request.id}')">
                                Отклонить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

function acceptFriendRequest(requestId) {
    const request = friendRequests.find(req => req.id === requestId);
    if (!request) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    request.status = 'accepted';
    
    // Добавляем друг друга в друзья
    const fromUser = allUsers[request.from];
    const toUser = allUsers[request.to];
    
    if (fromUser && toUser) {
        if (!fromUser.friends.includes(toUser.username)) {
            fromUser.friends.push(toUser.username);
        }
        if (!toUser.friends.includes(fromUser.username)) {
            toUser.friends.push(fromUser.username);
        }
        
        // Удаляем из списков заявок
        fromUser.sentRequests = fromUser.sentRequests.filter(u => u !== toUser.username);
        toUser.friendRequests = toUser.friendRequests.filter(u => u !== fromUser.username);
        
        allUsers[fromUser.username] = fromUser;
        allUsers[toUser.username] = toUser;
    }
    
    saveData();
    
    showNotification(`Вы приняли заявку от @${request.from}`, 'success');
    loadFriendRequests();
    loadContacts();
    loadUsersToAdd();
}

function rejectFriendRequest(requestId) {
    const requestIndex = friendRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    const request = friendRequests[requestIndex];
    
    // Удаляем из списков заявок пользователей
    const fromUser = allUsers[request.from];
    const toUser = allUsers[request.to];
    
    if (fromUser) {
        fromUser.sentRequests = fromUser.sentRequests.filter(u => u !== request.to);
        allUsers[fromUser.username] = fromUser;
    }
    if (toUser) {
        toUser.friendRequests = toUser.friendRequests.filter(u => u !== request.from);
        allUsers[toUser.username] = toUser;
    }
    
    // Удаляем заявку
    friendRequests.splice(requestIndex, 1);
    
    saveData();
    
    showNotification(`Вы отклонили заявку от @${request.from}`, 'info');
    loadFriendRequests();
}

function loadFriendsList() {
    const container = document.getElementById('friends-list');
    if (!container) return;
    
    const friends = currentUser.friends || [];
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>Нет друзей</h3>
                <p>Добавьте друзей, чтобы видеть их здесь</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    friends.forEach(username => {
        const user = allUsers[username];
        if (user) {
            html += createContactCard(user);
        }
    });
    
    container.innerHTML = html;
}

function loadSentRequests() {
    const container = document.getElementById('sent-requests-list');
    if (!container) return;
    
    const sentRequests = friendRequests.filter(req => 
        req.from === currentUser.username && req.status === 'pending'
    );
    
    if (sentRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paper-plane"></i>
                <h3>Нет отправленных заявок</h3>
                <p>Вы пока не отправили ни одной заявки</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    sentRequests.forEach(request => {
        const toUser = allUsers[request.to];
        if (toUser) {
            html += `
                <div class="request-item">
                    <div class="user-avatar" style="width:48px;height:48px;">
                        ${toUser.avatar ? 
                            `<img src="${toUser.avatar}" alt="${toUser.name}" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : 
                            toUser.name.charAt(0)
                        }
                    </div>
                    <div class="request-info">
                        <div class="request-name">${toUser.name}</div>
                        <div class="request-username">@${toUser.username}</div>
                        <div class="request-actions">
                            <span class="btn btn-outline">Ожидает ответа</span>
                            <button class="btn btn-danger" onclick="cancelFriendRequest('${request.id}')">
                                Отменить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

function cancelFriendRequest(requestId) {
    const requestIndex = friendRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    const request = friendRequests[requestIndex];
    
    // Удаляем из списков заявок пользователей
    const fromUser = allUsers[request.from];
    const toUser = allUsers[request.to];
    
    if (fromUser) {
        fromUser.sentRequests = fromUser.sentRequests.filter(u => u !== request.to);
        allUsers[fromUser.username] = fromUser;
    }
    if (toUser) {
        toUser.friendRequests = toUser.friendRequests.filter(u => u !== request.from);
        allUsers[toUser.username] = toUser;
    }
    
    // Удаляем заявку
    friendRequests.splice(requestIndex, 1);
    
    saveData();
    
    showNotification('Заявка отменена', 'info');
    loadSentRequests();
    loadUsersToAdd();
}

function removeFriend(username) {
    if (!confirm(`Удалить ${username} из друзей?`)) return;
    
    // Удаляем из друзей у обоих пользователей
    currentUser.friends = currentUser.friends.filter(friend => friend !== username);
    
    const friendUser = allUsers[username];
    if (friendUser) {
        friendUser.friends = friendUser.friends.filter(friend => friend !== currentUser.username);
        allUsers[username] = friendUser;
    }
    
    allUsers[currentUser.username] = currentUser;
    saveData();
    
    showNotification(`@${username} удален из друзей`, 'info');
    loadContacts();
    loadFriendsList();
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
window.acceptFriendRequestFromSearch = function(username) {
    const user = allUsers[username];
    if (!user || !user.friendRequests.includes(currentUser.username)) {
        showNotification('Заявка не найдена', 'error');
        return;
    }
    
    // Находим заявку
    const request = friendRequests.find(req => 
        req.from === username && req.to === currentUser.username && req.status === 'pending'
    );
    
    if (request) {
        acceptFriendRequest(request.id);
    }
};

window.startChatWith = function(username) {
    startChatWith(username);
};

window.sendFriendRequest = function(username) {
    sendFriendRequest(username);
};

window.removeFriend = function(username) {
    removeFriend(username);
};

// ПРИВАТНОСТЬ
function checkPrivacy(user, setting) {
    if (!user || !user.privacySettings) return true;
    
    const privacy = user.privacySettings[setting];
    
    switch(privacy) {
        case 'public':
        case 'everyone':
            return true;
        case 'friends':
            return user.friends.includes(currentUser.username);
        case 'private':
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

// НАСТРОЙКИ
function initSettingsEvents() {
    console.log('Инициализация событий настроек...');
    
    // Сохранение профиля
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }
    
    // Сохранение приватности
    const savePrivacyBtn = document.getElementById('save-privacy');
    if (savePrivacyBtn) {
        savePrivacyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePrivacySettings();
        });
    }
    
    // Изменение пароля
    const securityForm = document.getElementById('security-form');
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    // Удаление аватара
    const removeAvatarBtn = document.getElementById('remove-avatar');
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            removeAvatar();
        });
    }
}

function saveProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const username = document.getElementById('profile-username').value.trim().toLowerCase();
    const bio = document.getElementById('profile-bio').value.trim();
    
    if (!name) {
        showNotification('Введите имя', 'error');
        return;
    }
    
    if (!username) {
        showNotification('Введите юзернейм', 'error');
        return;
    }
    
    // Проверяем, не занят ли юзернейм другим пользователем
    if (username !== currentUser.username && allUsers[username]) {
        showNotification('Этот юзернейм уже занят', 'error');
        return;
    }
    
    // Обновляем данные пользователя
    currentUser.name = name;
    currentUser.username = username;
    currentUser.bio = bio;
    currentUser.avatar = currentUser.avatar || generateAvatar(name.charAt(0));
    
    // Обновляем в общем списке пользователей
    allUsers[username] = currentUser;
    
    // Если юзернейм изменился, удаляем старую запись
    if (username !== currentUser.username) {
        delete allUsers[currentUser.username];
        currentUser.username = username;
    }
    
    saveData();
    updateUserInterface();
    
    showNotification('Профиль обновлен', 'success');
}

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

function changePassword() {
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    
    if (!currentPass) {
        showNotification('Введите текущий пароль', 'error');
        return;
    }
    
    if (currentPass !== currentUser.password) {
        showNotification('Текущий пароль неверен', 'error');
        return;
    }
    
    if (!newPass) {
        showNotification('Введите новый пароль', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showNotification('Новый пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    currentUser.password = newPass;
    allUsers[currentUser.username] = currentUser;
    
    saveData();
    
    // Очищаем форму
    const securityForm = document.getElementById('security-form');
    if (securityForm) securityForm.reset();
    
    showNotification('Пароль успешно изменен', 'success');
}

function removeAvatar() {
    if (!confirm('Удалить аватар?')) return;
    
    currentUser.avatar = null;
    allUsers[currentUser.username] = currentUser;
    saveData();
    updateUserInterface();
    
    showNotification('Аватар удален', 'success');
}

// МОДАЛЬНЫЕ ОКНА
function showNewChatModal() {
    // Простая реализация
    showNotification('Функция создания нового чата в разработке', 'info');
}

// УТИЛИТЫ
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function resetErrors(formType) {
    const form = document.getElementById(`${formType}-form`);
    if (form) {
        form.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
}

function showNotification(message, type = 'info') {
    console.log('Уведомление:', message, type);
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Стили уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1e293b;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'};
        animation: slideIn 0.3s ease;
        transition: all 0.3s ease;
    `;
    
    // Добавляем стили анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // меньше суток
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 604800000) { // меньше недели
            return date.toLocaleDateString('ru-RU', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('ru-RU');
        }
    } catch (e) {
        return '';
    }
}
