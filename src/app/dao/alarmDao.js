const { pool } = require("../../../config/database");

// index
async function get_list(id) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
    select 
        id,
        top_logo ,
        add_title ,
        content ,
        type ,
        click_url 
    from 
        alarn a 
 where 
        user_number  = ${id} `;

  const [rows] = await connection.query(selectEmailQuery)
  connection.release();

  return rows;
}

module.exports = {
    get_list,
};
