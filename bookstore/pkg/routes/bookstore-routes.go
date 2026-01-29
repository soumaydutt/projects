package routes

import (
	"github.com/gorilla/mux"
	"github.com/ishansaini194/Projects/bookstore/pkg/controllers"
)

var RegisterBookRoutes = func(router *mux.Router) {
	router.HandleFunc("/books", controllers.CreateBook).Methods("POST")
	router.HandleFunc("/book", controllers.GetBook).Methods("GET")
	router.HandleFunc("/book/{id}", controllers.GetBookById).Methods("GET")
	router.HandleFunc("/book/{id}", controllers.UpdateBook).Methods("PUT")
	router.HandleFunc("/book/{id}", controllers.DeleteBook).Methods("DELETE")
}
