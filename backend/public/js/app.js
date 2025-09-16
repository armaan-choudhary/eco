const BACKEND_URL = "http://localhost:8000";
const $ = (id) => document.getElementById(id);

// Simple message display utility
function setMsg(msg, success = true) {
    let el = document.getElementById('msg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'msg';
        el.style.margin = '12px 0';
        document.body.prepend(el);
    }
    el.textContent = msg;
    el.style.color = success ? 'green' : 'red';
}

// Token utility for JWT storage
const token = {
    get: () => localStorage.getItem('token'),
    set: (t) => localStorage.setItem('token', t),
    del: () => localStorage.removeItem('token')
};

// Toggle between login and signup views
function show(view) {
    document.getElementById('view-signup').style.display = view === 'view-signup' ? '' : 'none';
    document.getElementById('login-email').parentElement.style.display = view === 'view-login' ? '' : 'none';
    document.getElementById('view-dashboard').style.display = view === 'view-dashboard' ? '' : 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    // ======= CONFIG =======
    $('btn-signup').addEventListener('click', async ()=>{
        const payload = {
            name: $('signup-name').value.trim(),
            age: Number($('signup-age').value),
            gender: $('signup-gender').value,
            phone: $('signup-phone').value.trim(),
            email: $('signup-email').value.trim(),
            password: $('signup-password').value,
        };
        try{
            const res = await fetch(BACKEND_URL + '/signup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail || JSON.stringify(data));
            setMsg('Account created. You can now log in.', true);
            show('view-login');
        }catch(err){ setMsg('Signup failed: ' + err.message, false) }
    });

    // login
    $('btn-login').addEventListener('click', async ()=>{
        const payload = { email: $('login-email').value.trim(), password: $('login-password').value };
        try{
            const res = await fetch(BACKEND_URL + '/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail || JSON.stringify(data));
            token.set(data.access_token);
            setMsg('Logged in — redirecting to dashboard.', true);
            await loadProfile();
            show('view-dashboard');
        }catch(err){ setMsg('Login failed: ' + err.message, false) }
    });

    // update karma
    $('btn-karma').addEventListener('click', async ()=>{
        const delta = Number($('karma-delta').value);
        if(!Number.isFinite(delta) || delta===0){ setMsg('Enter a non-zero number for karma delta', false); return; }
        try{
            const t = token.get();
            const res = await fetch(BACKEND_URL + '/karma', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}, body: JSON.stringify({delta}) });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail || JSON.stringify(data));
            $('karma-value').innerText = data.karma_points;
            setMsg('Karma updated', true);
        }catch(err){ setMsg('Karma update failed: ' + err.message, false) }
    });

    // logout
    $('btn-logout').addEventListener('click', ()=>{ token.del(); setMsg('Logged out', true); show('view-login'); });

    // Toggle between login and signup views
    document.getElementById('btn-show-signup').onclick = () => show('view-signup');
    document.getElementById('btn-back-login').onclick = () => show('view-login');
    // Show login by default
    show('view-login');

    // load profile on start if token exists
    (async ()=>{ if(token.get()) await loadProfile(); else show('view-login'); })();
});

// fetch profile
async function loadProfile(){
const t = token.get();
if(!t){ setMsg('Not logged in', false); show('view-login'); return; }
try{
const res = await fetch(BACKEND_URL + '/me', { headers: {'Authorization':'Bearer '+t} });
const data = await res.json();
if(!res.ok) throw new Error(data.detail || JSON.stringify(data));
$('user-name').innerText = data.name;
$('user-email').innerText = data.email;
$('user-phone').innerText = data.phone;
$('user-age').innerText = 'Age: ' + data.age;
$('karma-value').innerText = data.karma_points;
show('view-dashboard');
}catch(err){ setMsg('Could not fetch profile: ' + err.message, false); token.del(); show('view-login'); }
}