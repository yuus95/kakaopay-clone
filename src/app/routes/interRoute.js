module.exports = function(app){
    const inter = require('../controllers/interController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/integration-account', jwtMiddleware,inter.get_user_info); //개인정보 조회
    app.post('/integration-account', jwtMiddleware,inter.post_user_info); //통합 개인정보 등록
};
