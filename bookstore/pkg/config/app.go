package config

import (
	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	dB *gorm.DB
)

func Connect() {
	d, err := gorm.Open(mysql.New(mysql.Config{
		DriverName: "mysql",
		DSN:        "bookuser:bookpass@tcp(localhost:3306)/gorm?charset=utf8&parseTime=True&loc=Local",
	}))
	if err != nil {
		panic("Failed to connect to database")
	}
	dB = d
}

func GetDB() *gorm.DB {
	return dB
}
