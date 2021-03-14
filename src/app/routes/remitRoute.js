module.exports = function(app){
    const remit = require('../controllers/remitController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    
    
    //리스트
    app.get('/friends',jwtMiddleware,remit.friend); //친구목록
    app.get('/recent-list',jwtMiddleware,remit.get_recent_list) //최근기록 리스트

    app.post('/bookmarks',jwtMiddleware,remit.clickStatus); //북마크API
    app.get('/bookmarks',jwtMiddleware,remit.get_book_mark_list)  //북마크 리스트API
    
    app.get('/banks',jwtMiddleware,remit.bankName); //은행 목록 보기


    //송금
    app.get('/accounts-check',jwtMiddleware,remit.account_check); //계좌확인
    // app.get('/remit-limit',jwtMiddleware,remit.limit_check); //계좌 한도 확인하기
    app.get('/remits-info',jwtMiddleware,remit.bankAccount); //송금전 금액확인API
    app.post('/remits',jwtMiddleware,remit.remit); //송금하기    
    app.post('/remits-memo',jwtMiddleware,remit.remit_memo)//송금 이후 메모하기

    
    //송금확인증
    app.get('/remits-confirm',jwtMiddleware,remit.get_remit_confirm_list) // 송금확인증보기
    app.get('/remits-confirm/:remit_number',jwtMiddleware,remit.get_remit_confirm_id) //송금 확인증 세부사항 보기


    //충전 
    app.get('/amounts-charge',jwtMiddleware,remit.get_amount_charge_list) //충전계좌리스트
    app.post('/amounts-charge',jwtMiddleware,remit.amount_charge); //충전 하기

    //받기
    app.post('/receive',jwtMiddleware,remit.remit_receive); //받기
    
    //내역
    app.get('/transaction-list',jwtMiddleware,remit.get_transaction_list) //충전계좌리스트
   

};