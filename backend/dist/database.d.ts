import mysql from 'mysql2/promise';
declare const _default: {
    query(sql: string, params?: any[]): Promise<any>;
    getConnection(): Promise<mysql.PoolConnection>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map