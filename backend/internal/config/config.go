package config

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	App       AppConfig
	DB        DBConfig
	JWT       JWTConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
	SMTP      SMTPConfig
	SMS       SMSConfig
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	AppURL   string
}

type SMSConfig struct {
	AccountSID string
	AuthToken  string
	FromNumber string
}

type AppConfig struct {
	Name string
	Env  string
	Port int
}

type DBConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type JWTConfig struct {
	AccessSecret        string
	RefreshSecret       string
	AccessExpiryMinutes int
	RefreshExpiryDays   int
}

type CORSConfig struct {
	Origins []string
}

type RateLimitConfig struct {
	Max           int
	ExpirySeconds int
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	_ = viper.ReadInConfig()

	// Railway injects PORT; fall back to APP_PORT for local dev
	port := viper.GetInt("PORT")
	if port == 0 {
		port = viper.GetInt("APP_PORT")
	}
	if port == 0 {
		port = 8080
	}

	cfg := &Config{
		App: AppConfig{
			Name: viper.GetString("APP_NAME"),
			Env:  viper.GetString("APP_ENV"),
			Port: port,
		},
		DB: DBConfig{
			Host:            viper.GetString("DB_HOST"),
			Port:            viper.GetInt("DB_PORT"),
			User:            viper.GetString("DB_USER"),
			Password:        viper.GetString("DB_PASSWORD"),
			Name:            viper.GetString("DB_NAME"),
			SSLMode:         viper.GetString("DB_SSLMODE"),
			MaxOpenConns:    viper.GetInt("DB_MAX_OPEN_CONNS"),
			MaxIdleConns:    viper.GetInt("DB_MAX_IDLE_CONNS"),
			ConnMaxLifetime: time.Duration(viper.GetInt("DB_CONN_MAX_LIFETIME")) * time.Second,
		},
		JWT: JWTConfig{
			AccessSecret:        viper.GetString("JWT_ACCESS_SECRET"),
			RefreshSecret:       viper.GetString("JWT_REFRESH_SECRET"),
			AccessExpiryMinutes: viper.GetInt("JWT_ACCESS_EXPIRY_MINUTES"),
			RefreshExpiryDays:   viper.GetInt("JWT_REFRESH_EXPIRY_DAYS"),
		},
		CORS: CORSConfig{
			Origins: strings.Split(viper.GetString("CORS_ORIGINS"), ","),
		},
		RateLimit: RateLimitConfig{
			Max:           viper.GetInt("RATE_LIMIT_MAX"),
			ExpirySeconds: viper.GetInt("RATE_LIMIT_EXPIRY_SECONDS"),
		},
		SMTP: SMTPConfig{
			Host:     viper.GetString("SMTP_HOST"),
			Port:     viper.GetInt("SMTP_PORT"),
			Username: viper.GetString("SMTP_USERNAME"),
			Password: viper.GetString("SMTP_PASSWORD"),
			From:     viper.GetString("SMTP_FROM"),
			AppURL:   viper.GetString("APP_URL"),
		},
		SMS: SMSConfig{
			AccountSID: viper.GetString("SMS_ACCOUNT_SID"),
			AuthToken:  viper.GetString("SMS_AUTH_TOKEN"),
			FromNumber: viper.GetString("SMS_FROM_NUMBER"),
		},
	}

	// Railway provides DATABASE_URL — parse it if individual fields are empty
	if cfg.DB.Host == "" {
		if dbURL := viper.GetString("DATABASE_URL"); dbURL != "" {
			if err := cfg.DB.parseURL(dbURL); err != nil {
				return nil, fmt.Errorf("invalid DATABASE_URL: %w", err)
			}
		}
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// parseURL parses a postgres:// or postgresql:// connection string.
func (c *DBConfig) parseURL(rawURL string) error {
	u, err := url.Parse(rawURL)
	if err != nil {
		return err
	}
	c.Host = u.Hostname()
	c.User = u.User.Username()
	c.Password, _ = u.User.Password()
	c.Name = strings.TrimPrefix(u.Path, "/")
	if p := u.Port(); p != "" {
		c.Port, _ = strconv.Atoi(p)
	}
	if ssl := u.Query().Get("sslmode"); ssl != "" {
		c.SSLMode = ssl
	} else {
		c.SSLMode = "require" // Railway requires SSL
	}
	return nil
}

func (c *Config) validate() error {
	if c.JWT.AccessSecret == "" {
		return fmt.Errorf("JWT_ACCESS_SECRET is required")
	}
	if c.JWT.RefreshSecret == "" {
		return fmt.Errorf("JWT_REFRESH_SECRET is required")
	}
	if c.DB.Host == "" {
		return fmt.Errorf("DB_HOST or DATABASE_URL is required")
	}
	return nil
}

func (c *DBConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode,
	)
}

func (c *Config) IsDev() bool {
	return c.App.Env == "development"
}

func (c *Config) IsProd() bool {
	return c.App.Env == "production"
}
