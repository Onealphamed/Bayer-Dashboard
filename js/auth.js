// AUTH MODULE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PASSWORD GATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CORRECT_PASSWORD = 'BayerUser';

function checkPassword() {
  const val = document.getElementById('pwInput').value;
  const err = document.getElementById('pwError');
  if (val === CORRECT_PASSWORD) {
    sessionStorage.setItem('bayer_auth', '1');
    const overlay = document.getElementById('pwOverlay');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 420);
    err.textContent = '';
  } else {
    err.textContent = 'Incorrect password. Please try again.';
    const input = document.getElementById('pwInput');
    input.style.borderColor = '#DC2626';
    input.style.boxShadow = '0 0 0 3px rgba(220,38,38,.1)';
    setTimeout(() => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    }, 1800);
    input.select();
  }
}

function togglePwVisibility() {
  const input = document.getElementById('pwInput');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Skip password if already authenticated in this session
if (sessionStorage.getItem('bayer_auth') === '1') {
  document.getElementById('pwOverlay').remove();
}
