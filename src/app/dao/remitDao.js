const { pool } = require("../../../config/database");


async function userNumber(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =    `
        select 
            uf.friend_number ,
            u.user_image ,
            u.name,
            u.nickname ,
            uf.book_mark ,
            uf.remit_type
        FROM 
            users u
        inner join
            users_friend uf
        on
            uf.friend_number  =u.id 	
        
        where 
        uf.user_number = ${id} 
 
    `

    const [userList] = await connection.query(query);
    connection.release();
    return userList;
}


async function oftenUse(id,friendNumber){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        update 
            users_friend 
        set 
            status =2 
        where 
            user_number = ${id}
        and
            friend_number = ${friendNumber}
    `

     await connection.query(query);
    connection.release();
    return 
}

async function oftenNoUse(id,friendNumber){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        update 
            users_friend 
        set 
            status = 1 
        where 
            user_number = ${id}
        and
            friend_number = ${friendNumber}
    `

    await connection.query(query);
    connection.release();
    return ;
}
    
async function bankName(){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
            select 
                 name,
                 bank_image
            from
                bank_name
            where 
               bank_group  = 1     
            order by
                 id 	
	
    `

    const [bankList] = await connection.query(query);
    connection.release();
    return bankList;
}

async function share_list(){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
            select 
                 name,
                 bank_image
            from
                bank_name
            where 
               bank_group  = 2     
            order by
                 id 	
	
    `

    const [share_list] = await connection.query(query);
    connection.release();
    return share_list;
}

        
async function getBankAccount(bankName,bankAccount){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
       
        select
            user_name  
        from 
            bank_account   
        where
            bank_name  = '${bankName}'
        AND 
            account = '${bankAccount}'

	
    `

    const [account] = await connection.query(query);
    connection.release();
    return account;
}




async function getAccountBank(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        
	
    select
        id,
        bank_name ,
        SUBSTR(account,-4) account,
        alias,
        account account_result
    from
        myaccount
    where 
        user_number =${id}
        and sort = 0 	
    `

    const [accountBank] = await connection.query(query);
    connection.release();
    return accountBank;
}

async function getNickName(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        
	
    select
        id,
        nickname
    from
        users
    where 
        id =${id}

    `

    const [accountBank] = await connection.query(query);
    connection.release();
    return accountBank;
}



async function myaccount_check(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        

	select
		count(account)  num
	from 
		myaccount
	where 
		user_number = ${id} and account='${account}'
	
	

    `

    const [myaccount] = await connection.query(query);
    connection.release();
    return myaccount;
}


async function limit_check(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        

        select 
            count ,
            remit_limit
        from
            account_fee 
        where 
            user_number = ${id}

    `

    const [list_related_fee] = await connection.query(query);
    connection.release();
    return list_related_fee;
}

    
async function get_balance(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        
	select 
    (select IFNULL(sum(amount),0) from transaction  where (transaction_type='충전' or transaction_type = '받기' and remit_confirm =1 or transaction_type ='송금취소') and user_number =${id}) 
    -(select IFNULL(sum(amount),0) from transaction  where( transaction_type ='송금' or transaction_type ='결제' or transaction_type = '출금') and user_number =${id}) -
    (select	IFNULL(sum(remit_fee),0)  	from  transaction		where(transaction_type='송금' ) and user_number =${id})  balance  
	from
	transaction
	where user_number = ${id}
	group by user_number 
    `
    const [balance] = await connection.query(query);
    connection.release();
    return balance;
}


async function send_remit(id, friend_number,recipient,image,nickname,remit_bank_name,remit_account,payment_type,amount,transaction_type,remit_type,remit_fee,remit_confirm){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
    INSERT INTO kakaopay.transaction
    (user_number, friend_number, relative_name, image, nickname, remit_bank_name, remit_account, payment_type, amount, transaction_type, remit_type, remit_fee, remit_confirm)
    VALUES(${id},${friend_number}, '${recipient}', '${image}', '${nickname}', '${remit_bank_name}', '${remit_account}', '${payment_type}', ${amount}, '${transaction_type}', '${remit_type}', ${remit_fee}, ${remit_confirm} );
    
    
    `
   
    const [list] = await connection.query(query);
    connection.release();
    return list ;
}


async function getbookmark(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

	select 
	 	book_mark
	 FROM 
	 	users_friend uf 
	 where 
	 	user_number =${id}
	 AND 
	 	friend_number =${friend_number}
    
    `

   const [book_mark] = await connection.query(query);
    connection.release();
    return book_mark;
}


    
async function recent_list(id, friend_number, image, recipient, bank_name,account, book_mark,nickname,remit_type){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

        
    INSERT INTO kakaopay.remit_recent
    (user_number, friend_number, image, name,bank_name, account, book_mark,nickname,remit_type)
    VALUES(${id}, ${friend_number}, '${image}', '${recipient}','${bank_name}', '${account}', '${book_mark}','${nickname}','${remit_type}');


    `
   

    await connection.query(query);
    connection.release();
    return ;
}

        
async function get_userinfo(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

    select 
		user_image,
		name,
		nickname 	
	from 
		users
	where id = ${id}	

    `

    const [list]=await connection.query(query);
    connection.release();
    return list;
}

async function remit_receive(id,friend_number,recipient,image,nickname,amount,number_related_remit){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
    INSERT INTO kakaopay.transaction
    (user_number, friend_number, relative_name, image, nickname,   payment_type, amount, transaction_type, remit_type,  remit_confirm,number_related_remit)
    VALUES(${id},${friend_number}, '${recipient}', '${image}', '${nickname}', '페이머니', ${amount}, '받기', 'kao', false,${number_related_remit});
     
    `
     await connection.query(query);
    connection.release();
    return 
}


    
async function check_friend_recent(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

    select 
        count(id) check_num
    from
        remit_recent
    where
        user_number=${id}
    and
        friend_number =${friend_number}
    and
         friend_number >=1 	

    `

  const [list] =  await connection.query(query);
    connection.release();
    return list
}

async function check_account_recent(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

    select 
        count(id) check_num
    from
        remit_recent
    where
        user_number=${id}
    and
    account =${account}
    
    `

  const [list] =  await connection.query(query);
    connection.release();
    return list
}

        
async function update_recent_friend_list(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
	
	update
		remit_recent set update_at = now()
	where
    user_number = ${id}
    and
		friend_number = ${friend_number}
		
    `
   await connection.query(query);
    connection.release();
    return 
}

async function update_recent_account_list(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
	
	update
		remit_recent set update_at = now()
	where
        user_number = ${id}
	and
		account = '${account}'	
    `
   await connection.query(query);
    connection.release();
    return 
}

async function get_recent_list(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
        select 
            id,
            friend_number,
            image,
            name,
            bank_name,
            account,
            book_mark,
            nickname,
            remit_type
        from remit_recent rr 
        where 
            user_number = ${id}
        group by friend_number ,account 
        order by update_at  DESC 


    `

  const [list]= await connection.query(query);
   
    connection.release();
    return list
}



async function check_recent(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
       	
    select 
        count(id) check_num
    FROM 
        remit_recent
    where 
        user_number =${id}
    and 
        account ='${account}'


        `

    const [list]= await connection.query(query);
    
        connection.release();
        return list
    }



async function update_list_book_mark_down(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
		update
        remit_recent 
    set
        book_mark = '1'
    where 
        friend_number =${friend_number}
    AND 
        user_number=${id}
        
    `

  await connection.query(query);
    connection.release();
    return
}

async function update_friend_book_mark_down(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
	update
			users_friend 
		set
			book_mark = '1'
        where 
            friend_number =${friend_number}
        AND 
            user_number=${id}
            
			
    `
  await connection.query(query);
    connection.release();
    return
}

async function update_list_book_mark_up(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
     update
        remit_recent 
    set
        book_mark = '2'
    where 
        friend_number =${friend_number}
    AND 
        user_number=${id}
        
        
			
    `
  await connection.query(query);
    connection.release();
    return
}


async function update_friend_book_mark_up(id,friend_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
	update
			users_friend 
		set
			book_mark = '2'
        where 
            friend_number =${friend_number}
        AND 
            user_number=${id}
            
			
    `
  await connection.query(query);
    connection.release();
    return
}

async function update_list_account_book_mark_up(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
	update
        remit_recent 
	set
		book_mark = '2'
    where 
        account =${account}
    AND 
        user_number=${id}
            
			
    `
  await connection.query(query);
    connection.release();
    return
}

async function update_list_account_book_mark_down(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         		
	update
        remit_recent 
	set
			book_mark = '1'
    where 
        account =${account}
    AND 
        user_number=${id}
            
			
    `
  await connection.query(query);
    connection.release();
    return
}

async function get_book_mark_list(id,account){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
  	
    select 
    "" friend_number,
        image,
        name,
        bank_name,
        account,
        nickname ,
        book_mark,
        remit_type,
        update_at
    from remit_recent 
    where 
        user_number =${id}
    AND 
        book_mark =2 
    and
        remit_type in ('mac','acc')


    UNION 

    select 
        uf.friend_number ,
        u.user_image image,
        u.name name,
        "" bank_name,
        "" account,
        u.nickname nickname,
        uf.book_mark,
        uf.remit_type,
        uf.update_at update_at
        
    from 
        users_friend uf 
    inner join
        users u
    on 
        u.id = uf.friend_number 
    where 
        uf.user_number =${id} 
    and
        book_mark = 2 

        group by friend_number ,account
        order by update_at desc
            
			
    `

  const [list] = await connection.query(query);
    connection.release();
    return list
}


async function get_fee_list(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
    select  
        count ,
        remit_limit 
    from 
       account_fee
    where 
        user_number  = ${id}

			
    `

    const [list] =  await connection.query(query);
    connection.release();
    return list
}

async function update_remit_limit(id,count,limit){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =    `
    update 
        account_fee
    set     
        count =${count} ,
        remit_limit  =${limit}
    where 
        user_number  = ${id}
    `

    await connection.query(query);
    connection.release();
    return 
}


async function balance_after_remit(id,insertId){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
		
					    
    select 
    (select IFNULL(sum(amount),0) from transaction  where (transaction_type='충전' or transaction_type = '받기' and remit_confirm =1 or transaction_type ='송금취소') and user_number =${id}) 
    -(select IFNULL(sum(amount),0) from transaction  where( transaction_type ='송금' or transaction_type ='결제' or transaction_type = '출금') and user_number =${id}) -
    (select	IFNULL(sum(remit_fee),0)  	from  transaction		where(transaction_type='송금' ) and user_number =${id})  balance  
    from    
         transaction  
    where
         id BETWEEN  1 and ${insertId}
    and
    user_number = ${id} 
    group by user_number 
        
        
    `
    const [list] =  await connection.query(query);
    connection.release();
    return list
}


async function get_remit_confirm_list(id,year){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
		
					    
        select 
            id,
            relative_name,
            nickname ,
            remit_bank_name bank ,
            substr(remit_account,-4) account,
            amount ,
            remit_type ,
            SUBSTRING(create_at,6,5) as month, 
            CASE DAYOFWEEK(create_at)
            
            WHEN '1' THEN '(일)'
            
            WHEN '2' THEN '(월)'
            
            WHEN '3' THEN '(화)'
            
            WHEN '4' THEN '(수)'
            
            WHEN '5' THEN '(목)'
            
            WHEN '6' THEN '(금)'
            
            WHEN '7' THEN '(토)'
        END AS day,	
            SUBSTRING(create_at,12,5) time
        from
            transaction 
        where 
        transaction_type='송금'
        AND 
            year(create_at) = ${year} 
        and
            user_number = ${id}
        and
        remit_type = 'acc' 
        OR  
            remit_type = 'mac'
        OR
            remit_type='kao' and remit_confirm_day is not null    
        ORDER  by create_at DESC 
    `
    const [list] =  await connection.query(query);
    connection.release();
    return list
}




async function update_remit_memo(remit_number,memo){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
	  update transaction set memo ='${memo}' where  id = ${remit_number}
    `

     await connection.query(query);
    connection.release();
    return 
}


async function get_remit_confirm_id(remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
    select 
        tt.remit_type,
        tt.id remit_number,
        tt.create_at remit_date,
        u.name remit_user ,
        u.email remit_email,
        tt.amount ,
        tt.relative_name as recipient,
        tt.remit_bank_name,
        tt.remit_account,
        tt.memo, 
        remit_confirm_day,
        tt.remit_fee fee
    from 
            transaction tt
    inner join
            users u 
    on 
            tt.user_number =u.id
    where 
        tt.transaction_type='송금'
    AND 	
        tt.id = ${remit_number}
    `

 const [remit_detail] = await connection.query(query);
    connection.release();
    return remit_detail
}

    
async function get_amount_charge_list(id){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
    select
        id bank_number,
        bank_name ,
        account ,
        alias 
    from 
        myaccount
    where 
        user_number  = ${id} 
    order by sort ,id
    `

 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}



  
async function get_bank_balance(id,bank_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         
        select
            my.bank_name ,
         	my.account ,
  			my.alias ,
            ba.balance 
        from
            myaccount my
        inner join
            bank_account ba 
        on
            my.account  = ba.account 
        where 
            my.user_number =${id}
        AND 
            my.id = ${bank_number}
       
    `

 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}


    
async function charge_amount(user_number, image, nickname, remit_bank_name, remit_account, payment_type, amount, transaction_type){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         
    INSERT INTO 
    transaction
    (user_number, image, nickname, remit_bank_name, remit_account, payment_type, amount, transaction_type)
    VALUES(${user_number}, '${image}', '${nickname}', '${remit_bank_name}', '${remit_account}', '${payment_type}', ${amount}, '${transaction_type}');

    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}

async function update_receive_status(id,remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
         
    update 
        transaction
    set
        remit_confirm_day =now(),
        remit_confirm=true
    where user_number = ${id}
    and number_related_remit =${remit_number}	
    
    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}


async function update_remit_status(remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
 	
		
	update 
		transaction
	set
        remit_confirm_day =now(),
        remit_confirm=true	
	where 
	 id =${remit_number}	
  
    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}
async function get_balance_number(id,remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
 	
    select 
        id 
    from 
        transaction  
    where
         user_number = ${id}
    and 
        number_related_remit =${remit_number}
	
    `
    const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}
async function receive_check(id,remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
 	
    select 
        remit_confirm 
    from 
        transaction  
    where
         user_number = ${id}
    and 
        number_related_remit =${remit_number}
	
    `
    const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}





async function get_remit_info(remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
 	
    select 
		u.name ,
		SUBSTRING(tt.remit_confirm_day,1,10) as month, 
	   	CASE DAYOFWEEK(remit_confirm_day)
			
			WHEN '1' THEN '(일)'
			
			WHEN '2' THEN '(월)'
			
			WHEN '3' THEN '(화)'
			
			WHEN '4' THEN '(수)'
			
			WHEN '5' THEN '(목)'
			
			WHEN '6' THEN '(금)'
			
			WHEN '7' THEN '(토)'
		END AS day,	
	   	SUBSTRING(remit_confirm_day,12,8) time
	from 
		transaction  tt
	inner join
		users u
	on
		tt.user_number  = u.id
		
	where 
	 tt.id =${remit_number}
	
    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}





async function get_remit_info(remit_number){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `
	
    select 
		u.name ,
		SUBSTRING(tt.remit_confirm_day,1,10) as month, 
	   	CASE DAYOFWEEK(remit_confirm_day)
			
			WHEN '1' THEN '(일)'
			
			WHEN '2' THEN '(월)'
			
			WHEN '3' THEN '(화)'
			
			WHEN '4' THEN '(수)'
			
			WHEN '5' THEN '(목)'
			
			WHEN '6' THEN '(금)'
			
			WHEN '7' THEN '(토)'
		END AS day,	
	   	SUBSTRING(remit_confirm_day,12,8) time
	from 
		transaction  tt
	inner join
		users u
	on
		tt.user_number  = u.id
		
	where 
	 tt.id =${remit_number}
	
    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}


async function get_tran_list(id,year,month){
    const connection = await pool.getConnection(async (conn)=>conn);
    const query  =
    `

    select 
        day(create_at) day ,
        relative_name ,
        IFNULL(nickname,'') nickname ,
        IFNULL(remit_bank_name,'') remit_bank_name,
        remit_type ,
        IFNULL(remit_account,'') remit_account,
        transaction_type ,
        IFNULL(remit_confirm,0) remit_confirm ,
        SUBSTR(create_at,-8,5) time,
        amount,
        number_related_remit
    from 
        transaction
    where 
        user_number = ${id}
    AND 
        YEAR(create_at)  =${year}
    AND 
        month(create_at) = ${month}
    order by 	create_at desc 

	
    `
 const [charge_list] = await connection.query(query);
    connection.release();
    return charge_list
}


module.exports= {
    userNumber,
    oftenUse,
    oftenNoUse,
    bankName,
    getBankAccount,
    getAccountBank,
    getNickName,
    myaccount_check,
    limit_check,
    get_balance,
    share_list,
    send_remit,
    getbookmark,
    recent_list,
    get_userinfo,
    remit_receive,
    check_friend_recent,
    check_account_recent,
    get_recent_list,
    update_recent_friend_list,
    update_recent_account_list,
    update_list_book_mark_down,
    update_friend_book_mark_down,
    update_list_book_mark_up,
    update_friend_book_mark_up,
    update_list_account_book_mark_up,
    update_list_account_book_mark_down,
    get_book_mark_list,
    get_fee_list,
    update_remit_limit,
    balance_after_remit,
    get_remit_confirm_list,
    update_remit_memo,
    get_remit_confirm_id,
    get_amount_charge_list,
    get_bank_balance,
    charge_amount,
    update_receive_status,
    update_remit_status,
    get_balance_number,
    receive_check,
    get_remit_info,
    check_recent,
    get_tran_list

}