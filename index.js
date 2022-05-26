const express = require("express");
const app = express();
const path = require("path")
const mongoose = require("mongoose");
const bodyParser = require('body-parser')
const uniqid = require('uniqid');
const methodOverride = require('method-override')
const AppError = require("./AppError")

const Product = require("./models/product")

mongoose.connect('mongodb://localhost:27017/farmStand2', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
	console.log("Mongo Connection achieved");
}).catch((err) => {
	console.log("MONGO CONNECTION ERRROR: " + err);
})

app.use(methodOverride("_method"))
app.use(express.urlencoded({ extended: true }))
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs")

const categories = ["fruit", "vegetable", "dairy", "mushrooms"]

app.get("/products", async(req,res, next) => {
	try{
		const {category} = req.query;
		if(category){
			const products = await Product.find({category: category});	
			res.render("products/index", {products, category})
		}else{
			const products = await Product.find({});
			res.render("products/index", {products, category: "ALL"})
		}
	}catch(err){
		next(err);
	}
	
})

app.get("/products/new", (req,res) => {
	res.render("products/new", {categories});
})
// FUNCTION WRAPPING ASYNC FUNCTION AND CHECKING FOR ERRORS
function wrapAsync(fn){
	return function(req,res,next){
		fn(req,res,next).catch(er => next(er));
	}
}

app.get("/products/:id", wrapAsync(async(req,res, next) => {
		const {id} = req.params;
		const foundProduct = await Product.findById(id);
		if(!foundProduct) {
			throw new AppError("Product not found", 404)
		}
		res.render("products/show", {foundProduct})	
}))

app.get("/products/:id/edit", wrapAsync(async(req,res, next) => {
		const {id} = req.params
		const foundProduct = await Product.findById(id)
		if(!foundProduct) {
			throw new AppError("Product not found", 404)
		}
		res.render("products/update", {foundProduct, categories})
}))
// FILTER BY CATEGORIES
// app.get("/products")

// CREATE
app.post("/products", wrapAsync(async(req,res, next) => {
		const newProduct = new Product(req.body)
		await newProduct.save();
		console.log(newProduct)
		res.redirect(`/products/${newProduct._id}`)
}))
// UPDATE
app.put("/products/:id", wrapAsync(async(req,res, next) => {
		const {id} = req.params
		const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
		console.log(updatedProduct);
		res.redirect(`/products/${updatedProduct._id}`)
}))
// DELETE
app.delete("/products/:id", wrapAsync(async(req,res)=> {
		const {id} = req.params
		const deletedProduct = await Product.findByIdAndDelete(id);
		console.log(deletedProduct)
		res.redirect("/products")
}))

const handleValidationError = err => {
	console.dir(err);
	return new AppError(`You have not filled all fields ${err.message}`, 400)
}
app.use((err,req,res,next) => {
	console.log(err.name);
	if(err.name === "ValidationError") err = handleValidationError(err);
	next(err);
})
app.use(( err, req, res, next ) => {
	const {status = 500, message = "Something went wrong"} = err;
	res.status(status).send(message);
})

app.listen(3000, function(){
	console.log("SERVER RUNNING ON PORT 3000")
})