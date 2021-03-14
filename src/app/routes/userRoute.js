module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    app.post('/email-auth',user.email); //이메일 인증 전송
    app.get('/email-auth',user.emailCheck) // 이메일 인증 확인
    app.post('/phone-auth',user.phone) // 핸드폰 인증 전송
    app.get('/phone-auth',user.phoneCheck) //핸드폰 인증 확인
    app.post('/users',user.signUp); // 회원가입
    app.post('/users-login',user.signIn); //로그인
    // app.post('/users/logout',jwtMiddleware,user.logout)
    app.get('/auto-login',jwtMiddleware, user.check);//자동로그인


    // 카카오페이 비밀번호
    app.post('/kakaopay-password',jwtMiddleware, user.kakaopay_password_check) //확인
    app.patch('/kakaopay-password',jwtMiddleware, user.kakaopay_password_patch) //수정
    app.post('/kakaopay-phone-auth',jwtMiddleware, user.kakaopay_phone_auth_post) //카카오페이 폰인증
    app.get('/kakaopay-phone-auth',jwtMiddleware, user.kakaopay_phone_auth_get) //카카오페이 폰인증 확인
    // app.post('/kakaopay/card/auth',jwtMiddleware, user.kakaopay_card_auth_post)



    //유저 비밀번호 확인
    app.post('/users/password',jwtMiddleware, user.password_check)
};