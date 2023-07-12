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
    "items": database.define("items", { "user": sequelize.DataTypes.TEXT, "index": sequelize.DataTypes.DECIMAL, "parent": sequelize.DataTypes.DECIMAL, "order": sequelize.DataTypes.DECIMAL, "name": sequelize.DataTypes.TEXT, "description": sequelize.DataTypes.TEXT, "address": sequelize.DataTypes.TEXT, "public": sequelize.DataTypes.BOOLEAN, "shortcut": sequelize.DataTypes.DECIMAL }),
    "tags": database.define("tags", { "name": sequelize.DataTypes.TEXT, "item": sequelize.DataTypes.DECIMAL })
}
let api = express()
api.use(express.json())
api.get("/item/:user", function(request, response) {
    schema.items.findAll({
        "order": ["index"],
        "where": { "user": request.params.user }
    }).then(function(selection) {
        response.send(selection)
    })
})
api.post("/item", function(request) {
    schema.items.create(request.body)
})
api.put("/item", function(request) {
    schema.items.update(request.body, {
        "where": { "user": request.body.user, "index": request.body.index }
    })
})
api.put("/destroy", function(request) {
    schema.items.destroy({
        "where": { "user": request.body.user, "index": request.body.destroyed }
    })
})
api.use(function(request, response) {
    response.sendFile(__dirname + "/build/")
})
database.sync().then(function() {
    api.listen(3000)
})