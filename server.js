let sequelize = require("sequelize")
let express = require("express")
let database = new sequelize(require("./secrets").key, {
    "dialect": "postgres",
    "dialectOptions": {
        "ssl": { "rejectUnauthorized": false }
    }
})
let schema = {
    "users": database.define("users", { "name": sequelize.DataTypes.TEXT, "password": sequelize.DataTypes.TEXT }),
    "shares": database.define("shares", { "user": sequelize.DataTypes.TEXT, "item": sequelize.DataTypes.DECIMAL }),
    "items": database.define("items", { "index": sequelize.DataTypes.DECIMAL, "owner": sequelize.DataTypes.DECIMAL, "parent": sequelize.DataTypes.DECIMAL, "order": sequelize.DataTypes.DECIMAL, "name": sequelize.DataTypes.TEXT, "description": sequelize.DataTypes.TEXT, "address": sequelize.DataTypes.TEXT, "public": sequelize.DataTypes.BOOLEAN, "shortcut": sequelize.DataTypes.DECIMAL }),
    "tags": database.define("tags", { "name": sequelize.DataTypes.TEXT, "item": sequelize.DataTypes.DECIMAL })
}
let api = express()
api.use(express.json())
api.get("/item", async function(request, response) {
    response.send(await schema.items.findAll())
})
api.post("/item", function(request) {
    schema.items.create(request.body)
})
api.delete("/item/:index", function(request) {
    schema.items.destroy({
        "where": { "index": Number(request.params.index) }
    })
})
api.use(express.static(__dirname + "/build"))
database.sync().then(function() {
    api.listen(3000)
})