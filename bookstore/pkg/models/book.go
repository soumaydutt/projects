package models

import (
	"github.com/ishansaini194/Projects/bookstore/pkg/config"
	"gorm.io/gorm"
)

var db *gorm.DB

type Book struct {
	gorm.Model
	Name        string `json:"name"`
	Author      string `json:"author"`
	Publication string `json:"publication"`
}

func init() {
	config.Connect()
	db = config.GetDB()
	db.AutoMigrate(&Book{})
}

func (b *Book) CreateBook() (*Book, error) {
	if err := db.Create(b).Error; err != nil {
		return nil, err
	}
	return b, nil
}

func GetAllBooks() ([]Book, error) {
	var Books []Book
	if err := db.Find(&Books).Error; err != nil {
		return nil, err
	}
	return Books, nil
}

func GetBookById(Id int64) (*Book, *gorm.DB, error) {
	var book Book
	result := db.Where("id = ?", Id).First(&book)
	if result.Error != nil {
		return nil, result, result.Error
	}
	return &book, result, nil
}

func DeleteBook(ID int64) Book {
	var book Book
	db.Where("ID=?", ID).Delete(&book)
	return book
}
