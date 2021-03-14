const { pool } = require("../../../config/database");

// index
async function get_list(id) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
    select 
        email,
        name,
        gender ,
        birthday ,
        phone 
    from 
        users 
     where 
        id  = ${id} `;

  const [rows] = await connection.query(selectEmailQuery)
  connection.release();

  return rows;
}


// index
async function post_user_info(id, name, gender, birthday, email, address, occupation, job, job_address, income, use_purpose, tax_country) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
    


    INSERT INTO kakaopay.stock_account
    (user_number, name, gender, birthday, email, address, occupation, job, job_address, income, use_purpose, tax_country)
    VALUES(${id}, '${name}', '${gender}','${birthday}' ,'${email}', '${address}', '${occupation}', '${job}', '${job_address}', ${income}, '${use_purpose}', '${tax_country}');


    
    `
  
   
  
    const [rows] = await connection.query(query)
    connection.release();
  
    return rows;
  }
  

module.exports = {
    get_list,
    post_user_info
};
