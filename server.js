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
    "items": database.define("items", { "index": sequelize.DataTypes.DECIMAL, "path": sequelize.DataTypes.TEXT, "order": sequelize.DataTypes.DECIMAL, "name": sequelize.DataTypes.TEXT, "description": sequelize.DataTypes.TEXT, "address": sequelize.DataTypes.TEXT, "public": sequelize.DataTypes.BOOLEAN, "shortcut": sequelize.DataTypes.DECIMAL }),
    "tags": database.define("tags", { "name": sequelize.DataTypes.TEXT, "item": sequelize.DataTypes.DECIMAL })
}
let api = express()
api.use(express.json())
api.get("/item/:user", function(request, response) {
    schema.items.findAll().then(function(selection) {
        let items = []
        for (let index in selection) {
            if (selection[index].dataValues.path.startsWith("/" + request.params.user)) {
                items[selection[index].dataValues.index] = selection[index].dataValues
            }
        }
        response.send(items)
    })
})
api.post("/item", function(request) {
    schema.items.create(request.body)
})
api.put("/item", function(request) {
    schema.items.update({ "address": request.body.address, "name": request.body.name, "description": request.body.description }, {
        "where": { "index": request.body.index }
    })
})
api.delete("/item/:index", function(request) {
    schema.items.destroy({
        "where": { "index": Number(request.params.index) }
    })
})
api.use(express.static(__dirname + "/build"))
api.use(function(request, response) {
    response.sendFile(__dirname + "/build/")
})
database.sync().then(function() {
    api.listen(3000)
})