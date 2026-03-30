// Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href === '#') return;
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.1)';
                header.style.backdropFilter = 'blur(10px)';
            }
        });

        // Messages Modal Logic
        const messagesModal = document.getElementById('messages-modal');
        const messagesLink = document.getElementById('messages-link');
        const closeModal = document.getElementById('close-modal');
        const passwordForm = document.getElementById('password-form');
        const messagesList = document.getElementById('messages-list');
        const verifyPasswordBtn = document.getElementById('verify-password');
        const clearMessagesBtn = document.getElementById('clear-messages');
        const passwordError = document.getElementById('password-error');

        messagesLink.addEventListener('click', (e) => {
            e.preventDefault();
            messagesModal.style.display = 'flex';
            passwordForm.style.display = 'flex';
            messagesList.style.display = 'none';
            clearMessagesBtn.style.display = 'none';
            document.getElementById('admin-password').value = '';
            passwordError.style.display = 'none';
        });

        closeModal.addEventListener('click', () => {
            messagesModal.style.display = 'none';
        });

        messagesModal.addEventListener('click', (e) => {
            if (e.target === messagesModal) {
                messagesModal.style.display = 'none';
            }
        });

        verifyPasswordBtn.addEventListener('click', () => {
            const pwd = document.getElementById('admin-password').value;
            if (pwd === '5911adam') {
                passwordForm.style.display = 'none';
                messagesList.style.display = 'block';
                clearMessagesBtn.style.display = 'block';
                passwordError.style.display = 'none';
                renderMessages();
            } else {
                passwordError.style.display = 'block';
            }
        });

        // npoint.io — CORS-friendly JSON storage that works from GitHub Pages
        // GET to read, POST to update
        const API_URL = 'https://api.npoint.io/f770402cb3f7ab453812';

        async function saveMessage(name, email, text) {
            // Always save locally first
            let localMessages = JSON.parse(localStorage.getItem('admin_messages')) || [];
            const newMsg = { name, email, text, date: new Date().toLocaleString() };
            localMessages.push(newMsg);
            localStorage.setItem('admin_messages', JSON.stringify(localMessages));

            // Sync to npoint.io
            try {
                // 1. Read current remote messages
                const getResponse = await fetch(API_URL);
                if (!getResponse.ok) throw new Error('GET failed: ' + getResponse.status);
                let remoteMessages = await getResponse.json();
                if (!Array.isArray(remoteMessages)) remoteMessages = [];

                // 2. Append and write back (npoint uses POST to update)
                remoteMessages.push(newMsg);
                const postResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(remoteMessages)
                });
                if (!postResponse.ok) throw new Error('POST failed: ' + postResponse.status);
                console.log('Message synced to npoint.io successfully.');
            } catch (e) {
                console.error('Failed to sync to remote DB:', e);
            }
        }

        async function renderMessages() {
            messagesList.innerHTML = '<p style="color: #666; text-align: center;">جاري جلب الرسائل من قاعدة البيانات العالمية...</p>';
            let messages = [];
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('GET failed: ' + response.status);
                messages = await response.json();
                if (!Array.isArray(messages)) messages = [];
            } catch (e) {
                console.error('Failed to load remote DB:', e);
                messages = JSON.parse(localStorage.getItem('admin_messages')) || [];
            }

            if (messages.length === 0) {
                messagesList.innerHTML = '<p style="color: #666; text-align: center;">لا توجد رسائل حالياً.</p>';
                return;
            }
            messagesList.innerHTML = messages.map(msg =>
                '<div class="message-card">' +
                    '<h4>' + (msg.name || 'مجهول') + '</h4>' +
                    '<div class="email">' + (msg.email || '') + ' | ' + (msg.date || '') + '</div>' +
                    '<div class="text">' + (msg.text || '') + '</div>' +
                '</div>'
            ).reverse().join('');
        }

        clearMessagesBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من مسح جميع الرسائل نهائياً من قاعدة البيانات للجميع؟')) {
                localStorage.removeItem('admin_messages');
                messagesList.innerHTML = '<p style="color: #666; text-align: center;">جاري المسح...</p>';
                try {
                    const postResponse = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify([])
                    });
                    if (!postResponse.ok) console.error('Clear POST failed:', postResponse.status);
                } catch (e) { console.error('Clear failed:', e); }
                renderMessages();
            }
        });

        // Form submission
        document.querySelector('form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.innerText;
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const text = document.getElementById('message').value;
            const sendMethod = document.querySelector('input[name="send_method"]:checked').value;

            if (sendMethod === 'website') {
                saveMessage(name, email, text);
                alert('تم ترك الرسالة في الموقع بنجاح! ولن تصل إلى الإيميل.');
                this.reset();
            } else {
                // إرسال عبر البريد الإلكتروني باستخدام Web3Forms
                submitBtn.innerText = 'جاري الإرسال...';
                submitBtn.disabled = true;

                try {
                    const response = await fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            access_key: '95154481-610a-404d-845c-7602d0e1ede0',
                            name: name,
                            email: email,
                            message: text,
                            subject: 'رسالة جديدة من البورتفوليو - ' + name
                        })
                    });

                    const result = await response.json();
                    if (response.status === 200) {
                        saveMessage(name, email, text); // حفظ نسخة احتياطية
                        alert('تم إرسال الرسالة إلى بريدك الإلكتروني بنجاح!');
                        this.reset();
                    } else {
                        alert('حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.');
                        console.log(result);
                    }
                } catch (error) {
                    alert('حدث خطأ في الاتصال، يرجى التأكد من الإنترنت.');
                    console.error(error);
                } finally {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            }
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
                }
            });
        }, observerOptions);

        // Observe project cards
        document.querySelectorAll('.project-card').forEach(card => {
            observer.observe(card);
        });