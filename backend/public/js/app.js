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
// Store all institutes for filtering
let ALL_INSTITUTES = [];
async function fetchInstitutes() {
    try {
        const res = await fetch(BACKEND_URL + '/institutes');
        const data = await res.json();
        if (Array.isArray(data)) {
            ALL_INSTITUTES = data;
        }
    } catch (e) {
        ALL_INSTITUTES = [];
    }
}

function populateInstitutes(type, district) {
    const sel = $('signup-institute-id');
    sel.innerHTML = '<option value="">Loading...</option>';
    let filtered = ALL_INSTITUTES.filter(i => i.type === type);
    if (district) {
        filtered = filtered.filter(i => (i.city || '').toLowerCase() === district.toLowerCase());
    }
    if (filtered.length > 0) {
        sel.innerHTML = '<option value="">Select your ' + (type === 'school' ? 'school' : 'college') + '</option>' +
            filtered.map(i => `<option value="${i.id}">${i.name} (${i.code || ''})</option>`).join('');
    } else {
        sel.innerHTML = '<option value="">No ' + (type === 'school' ? 'schools' : 'colleges') + ' found</option>';
    }
}

// Punjab districts
const PUNJAB_DISTRICTS = [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "SAS Nagar", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"
];

function populateDistricts() {
    const sel = $("signup-district");
    sel.innerHTML = '<option value="">Select district</option>' +
        PUNJAB_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {

    await fetchInstitutes();
    populateDistricts();
    // Default: show schools
    populateInstitutes('school');

    $('signup-institute-type').addEventListener('change', function() {
        const type = this.value;
        const district = $('signup-district').value;
        populateInstitutes(type, district);
        // Change label
        $('signup-institute-label').innerText = type === 'school' ? 'School' : 'College';
    });
    $('signup-district').addEventListener('change', function() {
        const type = $('signup-institute-type').value;
        populateInstitutes(type, this.value);
    });
    $('btn-signup').addEventListener('click', async ()=>{
        const payload = {
            name: $('signup-name').value.trim(),
            age: Number($('signup-age').value),
            gender: $('signup-gender').value,
            phone: $('signup-phone').value.trim(),
            email: $('signup-email').value.trim(),
            password: $('signup-password').value,
            school_id: $('signup-institute-id').value.trim() // backend expects school_id, works for both
        };
        try{
            const res = await fetch(BACKEND_URL + '/signup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail || JSON.stringify(data));
            let msg = 'Account created! Signup bonus: +50 karma. You can now log in.';
            if(data.new_badges && Array.isArray(data.new_badges) && data.new_badges.length > 0) {
                msg += `\nNew badge${data.new_badges.length>1?'s':''} unlocked: ` + data.new_badges.join(', ');
            }
            setMsg(msg, true);
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
            // We'll check for daily bonus after loading profile
            await loadProfile(true);
            show('view-dashboard');
            // Show badge message if any new badges unlocked
            if(data.new_badges && Array.isArray(data.new_badges) && data.new_badges.length > 0) {
                setMsg(`Congratulations! New badge${data.new_badges.length>1?'s':''} unlocked: ` + data.new_badges.join(', '), true);
            }
            // Scroll to profile/dashboard section for clarity
            setTimeout(()=>{
                const dash = document.getElementById('view-dashboard');
                if(dash) dash.scrollIntoView({behavior:'smooth'});
            }, 200);
        }catch(err){ setMsg('Login failed: ' + err.message, false) }
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
// If checkDailyBonus is true, show a message if daily bonus is likely granted
async function loadProfile(checkDailyBonus){
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
// Extract school/college info from nested object
const school = data.school || {};
const isCollege = school.type === 'college';
$('user-school-name').innerText = (isCollege ? 'College: ' : 'School: ') + (school.name || '-');
$('user-school-code').innerText = (isCollege ? 'College Code: ' : 'School Code: ') + (school.code || '-');
$('user-state').innerText = 'State: ' + (school.state || 'Punjab');
$('user-district').innerText = 'District: ' + (school.city || '-');
$('user-streak').innerText = 'Learning Streak: ' + (data.learning_streak || 0);
$('user-login-dates').innerText = 'Login Dates: ' + (Array.isArray(data.login_dates) ? data.login_dates.join(', ') : '-');
$('user-role').innerText = 'Role: ' + (data.role || '-');
$('user-leaderboard').innerText = 'Leaderboard Rank: ' + (data.leaderboard_rank || '-');
if(Array.isArray(data.badges) && data.badges.length > 0) {
    $('badges-list').innerHTML = data.badges.map(b => `<span title="${b.name}"><img src="${b.image_url}" alt="${b.name}" style="height:20px;vertical-align:middle;margin-right:4px;"/>${b.name}</span>`).join(' ');
} else {
    $('badges-list').innerText = 'None';
}
// Show daily bonus message if likely granted
if(checkDailyBonus && Array.isArray(data.login_dates)) {
    const today = new Date().toISOString().slice(0,10);
    if(data.login_dates.length && data.login_dates[data.login_dates.length-1] === today && data.learning_streak === 1) {
        setMsg('Welcome! Daily login bonus: +5 karma.', true);
    } else if(data.login_dates.length && data.login_dates[data.login_dates.length-1] === today) {
        setMsg('Welcome back! Daily login bonus: +5 karma.', true);
    }
}
show('view-dashboard');
}catch(err){ setMsg('Could not fetch profile: ' + err.message, false); token.del(); show('view-login'); }
}