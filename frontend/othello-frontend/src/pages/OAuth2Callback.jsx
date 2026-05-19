import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithMezon } from '../api/authService';
import { saveToken } from '../utils/auth';

function OAuth2Callback() {
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state')

      if (code && !hasFetched.current) {
        hasFetched.current = true;
        try {
          let response;
          if (state === 'google') {
                response = await loginWithGoogle(code, state);
            } 
            else if (state && state.startsWith('mezon')) { 
                response = await loginWithMezon(code, state); 
            } 
            else {
                throw new Error("Nền tảng đăng nhập không hợp lệ"); 
            }
          saveToken(response.token, false);
          navigate('/');
        } catch (error) {
          console.error("Lỗi đăng nhập:", error);
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Đang xử lý đăng nhập, vui lòng đợi...</div>;
}

export default OAuth2Callback;