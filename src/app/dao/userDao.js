const { pool } = require("../../../config/database");






// Signup
async function userEmailCheck(email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
                SELECT email, nickname 
                FROM users 
                WHERE email = ?;
                `;
  const selectEmailParams = [email];
  const [emailRows] = await connection.query(
    selectEmailQuery,
    selectEmailParams
  );
  connection.release();

  return emailRows;
}

async function userPhoneCheck(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                  SELECT email,phone 
                  FROM users 
                  WHERE phone = ?;
                  `;
    const params = [phone];
    const [emailRows] = await connection.query(
      query,
      params
    );
    connection.release();
  
    return emailRows;
  }
  
  


async function userNicknameCheck(nickname) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectNicknameQuery = `
                SELECT email, nickname 
                FROM users 
                WHERE nickname = ?;
                `;
  const selectNicknameParams = [nickname];
  const [nicknameRows] = await connection.query(
    selectNicknameQuery,
    selectNicknameParams
  );
  connection.release();
  return nicknameRows;
}

async function insertUserInfo(insertUserInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserInfoQuery = `
    INSERT INTO kakaopay.users
    (email, password,name,phone,nickname,birthday,gender,lunar_check)
    VALUES(?,?,?,?,?,?,?,?);
    `;
  const insertUserInfoRow = await connection.query(
    insertUserInfoQuery,
    insertUserInfoParams
  );
  connection.release();
  return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectUserInfoQuery = `
                SELECT  id,email , password, nickname, status 
                FROM users 
                WHERE email = ?;
                `;

  let selectUserInfoParams = [email];
  const [userInfoRows] = await connection.query(
    selectUserInfoQuery,
    selectUserInfoParams
  );
  connection.release();
  return [userInfoRows];
}

async function checkEmailAuth(email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectUserInfoQuery = `
                
    select 
        count(email) as check_number ,
        update_at,
        count
    from 
        email_auth 
    where
         email =?
                  `;
  
    let selectUserInfoParams = [email];
    const [checkNumber] = await connection.query(
      selectUserInfoQuery,
      selectUserInfoParams
    );
    connection.release();
    return checkNumber;
  }
  

  async function inserEmailAuth(email,authNumber,count) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    INSERT INTO kakaopay.email_auth
    (email, auth_number,count)
    VALUES('${email}' , '${authNumber}',${count});

                  `;
  
    await connection.query(query);
    connection.release();
    return 
  }
  
  async function updateEmailAuth(email,authNumber,count) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    UPDATE kakaopay.email_auth
	SET auth_number='${authNumber}' ,count = ${count}
	WHERE email='${email}';
                  `;
  
     await connection.query(query);
    connection.release();
    return 
  }

  async function initAuth(email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    UPDATE kakaopay.email_auth
	SET count = 0
	WHERE email='${email}';
                  `;
  
     await connection.query(query);
    connection.release();
    return 
  }
  
  //이메일 인증번호 확인
  async function authCheck(email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    
    select
        email,
        auth_number ,
         update_at
    from 
        email_auth
	WHERE email='${email}';
                  `;
  
    const [list] = await connection.query(query);
    connection.release();
    return list
  }
  

//폰 인증번호 전송
async function insertMesAuth(phone,phoneAuthNumber) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
            INSERT INTO kakaopay.phone_auth
            (phone, auth_number)
            VALUES('${phone}', '${phoneAuthNumber}');
    
                  `;
    const [list] = await connection.query(
      query
    );
    connection.release();
  
    return list;
  }

  async function checkMesAuth(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
            select 
                count(phone) check_number,
                count,
                update_at
            from    
               phone_auth 
            where 
                phone ='${phone}'
    
                  `;
    const [list] = await connection.query(
      query
    );
    connection.release();
  
    return list;
  }


  async function initAuthPhone(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    UPDATE kakaopay.phone_auth
	SET count = 0
	WHERE phone='${phone}';
                  `;
  
     await connection.query(query);
    connection.release();
    return 
  }
  

  async function updateMesAuth(phone,authNumber,count) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    UPDATE kakaopay.phone_auth
    SET auth_number='${authNumber}', count=${count}
    WHERE phone='${phone}';
                  `;
  
     await connection.query(query);
    connection.release();
    return 
  }


  async function authPhoneCheck(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    
    select
        phone,
        auth_number ,
         update_at
    from 
      phone_auth
	WHERE phone='${phone}';
                  `;
  
    const [list] = await connection.query(query);
    connection.release();
    return list
  }
  


  async function checkPhoneUser(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
            select 
                count(phone) phone_user
            from    
                users 
            where 
                phone ='${phone}'
    
                  `;
    const [list] = await connection.query(
      query
    );
    connection.release();
  
    return list;
  }




  async function insertAccountFee(insertId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
    INSERT INTO kakaopay.account_fee
    (user_number, count, remit_limit, status)
    VALUES(${insertId}, 10, 2000000, '');
                  `;
    await connection.query(query);
    connection.release();

    return 
  }

  async function inserKaoPsw(insertId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
   	
	
	INSERT INTO kakaopay.kakao_password
    (user_number, kakao_password)
    VALUES(${insertId}, '000000');
                  `;
    await connection.query(query);
    connection.release();

    return 
  }


//카카오 비밀번호 체크
  async function kakao_password_check(id,password) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
   		 
	select 
        count(user_number) check_num
    from
        kakao_password
    where
        user_number = ${id}
    AND 	
        kakao_password  = '${password}'
                  `;

    const [list] = await connection.query(query);
    connection.release();

    return list
  }

//카카오 비밀번호 변경
  async function kakaopay_password_patch(id,password) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
    update 
        kakao_password 
    set 
        kakao_password ='${password}'
    WHERE 
        user_number  = ${id}
                    `;
    await connection.query(query);
    connection.release();
    return 
  }

  async function get_password(id) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
    
        select 
            password
        from 
            users 
        where 
            id= ${id}

                    `;
   const [psw] =  await connection.query(query);
    connection.release();
    return psw 
  }




  async function kakaopay_user_check(name,resident_number,agency,phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
        
    select
        count(id)  check_num
    from 
        kao_phone_auth kpa 
    where 
        name='${name}'
    and 
        resident_number ='${resident_number}'
    AND 
        agency ='${agency}'
    AND 
        phone ='${phone}'
                    `;
   const [list] =  await connection.query(query);
    connection.release();
    return list 
  }

  

  async function kakao_phone_count_init(name,resident_number,agency,phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
        
    UPDATE kao_phone_auth
	SET count = 0
	WHERE phone='${phone}';
                    `;
   const [list] =  await connection.query(query);
    connection.release();
    return list 
  }

  async function kakaopay_phone_auth_insert(phone,phoneAuthNumber) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
    update
        kao_phone_auth 
    set
        auth_number ='${phoneAuthNumber}',
        count = 1
    where 
    phone ='${phone}'


                    `;
    await connection.query(query);
    connection.release();
    return  
  }

  async function kakaopay_phone_auth_update(phone,phoneAuthNumber,count) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `   		 
    update
        kao_phone_auth 
    set
        auth_number ='${phoneAuthNumber}',
        count = ${count}
    where 
    phone ='${phone}'


                    `;
   await connection.query(query);
    connection.release();
    return 
  }

  
  async function kakao_phone_count_check(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
            select 
                count(phone) check_number,
                count,
                update_at
            from    
                kao_phone_auth 
            where 
                phone ='${phone}'
    
                  `;
    const [list] = await connection.query(query);
    connection.release();
  
    return list;
  }

  
  async function kakaopay_phone_auth_check(phone) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    
    select
        phone,
        auth_number ,
        update_at
    from 
        kao_phone_auth
	WHERE phone='${phone}';
                  `;
  
    const [list] = await connection.query(query);
    connection.release();
    return list
  }
  

  
  async function get_user_list(id) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
                
    
    select
       email,
       name,
       phone,
       birthday
    from 
        users
    WHERE 
         id = ${id}
                  `;
    const [list] = await connection.query(query);
    connection.release();
    return list
  }
  

module.exports = {
  userEmailCheck,
  userNicknameCheck,
  insertUserInfo,
  selectUserInfo,
  checkEmailAuth,
  inserEmailAuth,
  updateEmailAuth,
  initAuth,
  authCheck,
  insertMesAuth,
  checkMesAuth,
  initAuthPhone,
  updateMesAuth,
  authPhoneCheck,
  checkPhoneUser,
  userPhoneCheck,
  insertAccountFee,
  inserKaoPsw,
  kakao_password_check,
  kakaopay_password_patch,
  get_password,
  kakaopay_user_check,
  kakao_phone_count_init,
  kakaopay_phone_auth_insert,
  kakaopay_phone_auth_update,
  kakao_phone_count_check,
  kakaopay_phone_auth_check,
  get_user_list
};
