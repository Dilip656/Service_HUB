#!/usr/bin/env python3
"""
ServiceHub - Complete Service Marketplace Platform
Built with Flask, HTML, CSS and SQLite
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime, timedelta
import secrets
import re
from functools import wraps
import json

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database initialization
def init_db():
    """Initialize the SQLite database with all required tables"""
    conn = sqlite3.connect('servicehub.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Service categories and services
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Service providers
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS service_providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            business_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            service_name TEXT NOT NULL,
            location TEXT NOT NULL,
            hourly_rate DECIMAL(10,2) NOT NULL,
            experience_years INTEGER NOT NULL,
            description TEXT,
            kyc_verified BOOLEAN DEFAULT 0,
            kyc_status TEXT DEFAULT 'pending',
            aadhar_number TEXT,
            pan_number TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Bookings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            service_name TEXT NOT NULL,
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            duration_hours INTEGER NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            user_address TEXT NOT NULL,
            special_instructions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (provider_id) REFERENCES service_providers (id)
        )
    ''')
    
    # Payments
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (provider_id) REFERENCES service_providers (id)
        )
    ''')
    
    # Reviews
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (provider_id) REFERENCES service_providers (id)
        )
    ''')
    
    # Messages
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            sender_type TEXT NOT NULL,
            sender_id INTEGER NOT NULL,
            message_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id)
        )
    ''')
    
    # Admin settings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default admin user
    admin_hash = generate_password_hash('Admin@123')
    cursor.execute('''
        INSERT OR IGNORE INTO users (email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?)
    ''', ('admin@servicehub.com', admin_hash, 'System Administrator', 'admin'))
    
    # Insert default services
    default_services = [
        # Home Services
        ('Plumbing', 'home', 'Professional plumbing services for homes and offices'),
        ('Electrical Work', 'home', 'Licensed electrical installation and repair services'),
        ('Home Cleaning', 'home', 'Professional house cleaning and maintenance'),
        ('Painting', 'home', 'Interior and exterior painting services'),
        ('Carpentry', 'home', 'Custom furniture and woodwork services'),
        ('Landscaping', 'home', 'Garden design and maintenance services'),
        ('Moving Services', 'home', 'Professional moving and relocation services'),
        
        # Personal Services
        ('Beauty Services', 'personal', 'Hair, makeup, and beauty treatments'),
        ('Fitness Training', 'personal', 'Personal fitness and training sessions'),
        ('Massage Therapy', 'personal', 'Therapeutic and relaxation massage'),
        ('Pet Care', 'personal', 'Pet grooming, walking, and sitting services'),
        ('Tutoring', 'personal', 'Academic tutoring and educational support'),
        
        # Event Services
        ('Photography', 'events', 'Professional photography for events and portraits'),
        ('Event Planning', 'events', 'Complete event planning and coordination'),
        ('Catering', 'events', 'Food and beverage services for events'),
        
        # Business Services
        ('Web Development', 'business', 'Website design and development services'),
        ('Graphic Design', 'business', 'Logo, branding, and graphic design'),
        ('Accounting', 'business', 'Bookkeeping and financial services'),
        ('Legal Consulting', 'business', 'Legal advice and consultation'),
        ('IT Support', 'business', 'Computer and IT technical support')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO services (name, category, description)
        VALUES (?, ?, ?)
    ''', default_services)
    
    conn.commit()
    conn.close()

# Authentication decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('Admin access required')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def provider_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'provider_id' not in session:
            return redirect(url_for('provider_login'))
        return f(*args, **kwargs)
    return decorated_function

# Utility functions
def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('servicehub.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

def get_provider_by_id(provider_id):
    """Get provider by ID"""
    conn = get_db_connection()
    provider = conn.execute('SELECT * FROM service_providers WHERE id = ?', (provider_id,)).fetchone()
    conn.close()
    return provider

# Routes

@app.route('/')
def home():
    """Homepage"""
    conn = get_db_connection()
    
    # Get service counts by category
    services = conn.execute('''
        SELECT category, COUNT(*) as count 
        FROM services 
        WHERE is_active = 1 
        GROUP BY category
    ''').fetchall()
    
    # Get total provider count
    provider_count = conn.execute('SELECT COUNT(*) as count FROM service_providers WHERE kyc_verified = 1').fetchone()
    
    # Get recent reviews
    recent_reviews = conn.execute('''
        SELECT r.rating, r.comment, u.full_name, sp.business_name, s.name as service_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN service_providers sp ON r.provider_id = sp.id
        JOIN services s ON sp.service_name = s.name
        ORDER BY r.created_at DESC
        LIMIT 6
    ''').fetchall()
    
    conn.close()
    
    return render_template('home.html', 
                         services=services, 
                         provider_count=provider_count['count'] if provider_count else 0,
                         recent_reviews=recent_reviews)

@app.route('/services')
def browse_services():
    """Browse all services"""
    conn = get_db_connection()
    
    # Get all active services grouped by category
    services = conn.execute('''
        SELECT * FROM services 
        WHERE is_active = 1 
        ORDER BY category, name
    ''').fetchall()
    
    # Group services by category
    categories = {}
    for service in services:
        category = service['category']
        if category not in categories:
            categories[category] = []
        
        # Get provider count for this service
        provider_count = conn.execute('''
            SELECT COUNT(*) as count 
            FROM service_providers 
            WHERE service_name = ? AND kyc_verified = 1
        ''', (service['name'],)).fetchone()
        
        service_dict = dict(service)
        service_dict['provider_count'] = provider_count['count'] if provider_count else 0
        categories[category].append(service_dict)
    
    conn.close()
    
    return render_template('services.html', categories=categories)

@app.route('/providers')
def browse_providers():
    """Browse providers by service"""
    service_name = request.args.get('service', '')
    
    conn = get_db_connection()
    
    if service_name:
        providers = conn.execute('''
            SELECT sp.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
            FROM service_providers sp
            LEFT JOIN reviews r ON sp.id = r.provider_id
            WHERE sp.service_name = ? AND sp.kyc_verified = 1 AND sp.status = 'active'
            GROUP BY sp.id
            ORDER BY avg_rating DESC, sp.hourly_rate ASC
        ''', (service_name,)).fetchall()
    else:
        providers = conn.execute('''
            SELECT sp.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
            FROM service_providers sp
            LEFT JOIN reviews r ON sp.id = r.provider_id
            WHERE sp.kyc_verified = 1 AND sp.status = 'active'
            GROUP BY sp.id
            ORDER BY avg_rating DESC, sp.hourly_rate ASC
        ''').fetchall()
    
    # Get all services for filter dropdown
    services = conn.execute('SELECT DISTINCT name FROM services WHERE is_active = 1 ORDER BY name').fetchall()
    
    conn.close()
    
    return render_template('providers.html', providers=providers, services=services, selected_service=service_name)

# Continue with authentication routes...
@app.route('/login', methods=['GET', 'POST'])
def login():
    """User and admin login"""
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['email'] = user['email']
            session['full_name'] = user['full_name']
            session['role'] = user['role']
            
            flash('Login successful!')
            
            if user['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('user_dashboard'))
        else:
            flash('Invalid email or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        full_name = request.form['full_name'].strip()
        phone = request.form['phone'].strip()
        
        # Basic validation
        if not email or not password or not full_name:
            flash('All fields are required')
            return render_template('register.html')
        
        if len(password) < 8:
            flash('Password must be at least 8 characters')
            return render_template('register.html')
        
        conn = get_db_connection()
        
        # Check if user already exists
        existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing_user:
            flash('Email already registered')
            conn.close()
            return render_template('register.html')
        
        # Create new user
        password_hash = generate_password_hash(password)
        try:
            conn.execute('''
                INSERT INTO users (email, password_hash, full_name, phone)
                VALUES (?, ?, ?, ?)
            ''', (email, password_hash, full_name, phone))
            conn.commit()
            
            # Log in the new user
            user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            session['user_id'] = user['id']
            session['email'] = user['email']
            session['full_name'] = user['full_name']
            session['role'] = user['role']
            
            conn.close()
            
            flash('Registration successful! Welcome to ServiceHub!')
            return redirect(url_for('user_dashboard'))
            
        except Exception as e:
            conn.close()
            flash('Registration failed. Please try again.')
    
    return render_template('register.html')

# Provider Routes
@app.route('/provider/register', methods=['GET', 'POST'])
def provider_register():
    """Provider registration"""
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        business_name = request.form['business_name'].strip()
        owner_name = request.form['owner_name'].strip()
        phone = request.form['phone'].strip()
        service_name = request.form['service_name']
        location = request.form['location'].strip()
        hourly_rate = float(request.form['hourly_rate'])
        experience_years = int(request.form['experience_years'])
        description = request.form.get('description', '').strip()
        
        # Basic validation
        if not all([email, password, business_name, owner_name, phone, service_name, location, hourly_rate, experience_years]):
            flash('All required fields must be filled')
            return render_template('provider_register.html')
        
        if len(password) < 8:
            flash('Password must be at least 8 characters')
            return render_template('provider_register.html')
        
        conn = get_db_connection()
        
        # Check if provider already exists
        existing_provider = conn.execute('SELECT id FROM service_providers WHERE email = ?', (email,)).fetchone()
        if existing_provider:
            flash('Email already registered')
            conn.close()
            return render_template('provider_register.html')
        
        # Create new provider
        password_hash = generate_password_hash(password)
        try:
            conn.execute('''
                INSERT INTO service_providers (
                    email, password_hash, business_name, owner_name, phone,
                    service_name, location, hourly_rate, experience_years, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (email, password_hash, business_name, owner_name, phone,
                  service_name, location, hourly_rate, experience_years, description))
            conn.commit()
            
            # Log in the new provider
            provider = conn.execute('SELECT * FROM service_providers WHERE email = ?', (email,)).fetchone()
            session['provider_id'] = provider['id']
            session['provider_email'] = provider['email']
            session['business_name'] = provider['business_name']
            
            conn.close()
            
            flash('Registration successful! Your KYC verification is pending.')
            return redirect(url_for('provider_dashboard'))
            
        except Exception as e:
            conn.close()
            flash('Registration failed. Please try again.')
    
    # Get services for dropdown
    conn = get_db_connection()
    services = conn.execute('SELECT name FROM services WHERE is_active = 1 ORDER BY name').fetchall()
    conn.close()
    
    return render_template('provider_register.html', services=services)

@app.route('/provider/login', methods=['GET', 'POST'])
def provider_login():
    """Provider login"""
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        
        conn = get_db_connection()
        provider = conn.execute('SELECT * FROM service_providers WHERE email = ?', (email,)).fetchone()
        conn.close()
        
        if provider and check_password_hash(provider['password_hash'], password):
            session['provider_id'] = provider['id']
            session['provider_email'] = provider['email']
            session['business_name'] = provider['business_name']
            
            flash('Login successful!')
            return redirect(url_for('provider_dashboard'))
        else:
            flash('Invalid email or password')
    
    return render_template('provider_login.html')

@app.route('/provider/dashboard')
@provider_required
def provider_dashboard():
    """Provider dashboard"""
    provider_id = session['provider_id']
    conn = get_db_connection()
    
    # Get provider details
    provider = get_provider_by_id(provider_id)
    
    # Get recent bookings
    bookings = conn.execute('''
        SELECT b.*, u.full_name as customer_name, u.phone as customer_phone
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.provider_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
    ''', (provider_id,)).fetchall()
    
    # Get earnings this month
    current_month = datetime.now().strftime('%Y-%m')
    earnings = conn.execute('''
        SELECT SUM(total_amount) as total
        FROM bookings
        WHERE provider_id = ? AND status = 'completed' 
        AND strftime('%Y-%m', created_at) = ?
    ''', (provider_id, current_month)).fetchone()
    
    # Get rating
    rating = conn.execute('''
        SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
        FROM reviews
        WHERE provider_id = ?
    ''', (provider_id,)).fetchone()
    
    conn.close()
    
    return render_template('provider_dashboard.html', 
                         provider=provider,
                         bookings=bookings,
                         monthly_earnings=earnings['total'] or 0,
                         avg_rating=rating['avg_rating'],
                         review_count=rating['review_count'])

# User Dashboard
@app.route('/user/dashboard')
@login_required
def user_dashboard():
    """User dashboard"""
    user_id = session['user_id']
    conn = get_db_connection()
    
    # Get user details
    user = get_user_by_id(user_id)
    
    # Get recent bookings
    bookings = conn.execute('''
        SELECT b.*, sp.business_name, sp.phone as provider_phone
        FROM bookings b
        JOIN service_providers sp ON b.provider_id = sp.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
    ''', (user_id,)).fetchall()
    
    # Get total spent
    total_spent = conn.execute('''
        SELECT SUM(total_amount) as total
        FROM bookings
        WHERE user_id = ? AND status = 'completed'
    ''', (user_id,)).fetchone()
    
    conn.close()
    
    return render_template('user_dashboard.html',
                         user=user,
                         bookings=bookings,
                         total_spent=total_spent['total'] or 0)

# Booking Routes
@app.route('/book')
@login_required
def book_service():
    """Book a service"""
    provider_id = request.args.get('provider')
    service_name = request.args.get('service')
    
    if not provider_id:
        flash('Provider not specified')
        return redirect(url_for('browse_providers'))
    
    conn = get_db_connection()
    provider = conn.execute('SELECT * FROM service_providers WHERE id = ?', (provider_id,)).fetchone()
    conn.close()
    
    if not provider:
        flash('Provider not found')
        return redirect(url_for('browse_providers'))
    
    return render_template('book_service.html', provider=provider, service_name=service_name)

@app.route('/book', methods=['POST'])
@login_required
def create_booking():
    """Create a booking"""
    user_id = session['user_id']
    provider_id = request.form['provider_id']
    service_name = request.form['service_name']
    booking_date = request.form['booking_date']
    booking_time = request.form['booking_time']
    duration_hours = int(request.form['duration_hours'])
    user_address = request.form['user_address']
    special_instructions = request.form.get('special_instructions', '')
    
    conn = get_db_connection()
    
    # Get provider hourly rate
    provider = conn.execute('SELECT hourly_rate FROM service_providers WHERE id = ?', (provider_id,)).fetchone()
    if not provider:
        flash('Provider not found')
        return redirect(url_for('browse_providers'))
    
    total_amount = float(provider['hourly_rate']) * duration_hours
    
    # Create booking
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO bookings (
            user_id, provider_id, service_name, booking_date, booking_time,
            duration_hours, total_amount, user_address, special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, provider_id, service_name, booking_date, booking_time,
          duration_hours, total_amount, user_address, special_instructions))
    
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    flash('Booking created successfully!')
    return redirect(url_for('user_dashboard'))

# Admin Routes
@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """Admin dashboard"""
    conn = get_db_connection()
    
    # Get statistics
    stats = {
        'total_users': conn.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"').fetchone()['count'],
        'total_providers': conn.execute('SELECT COUNT(*) as count FROM service_providers').fetchone()['count'],
        'total_bookings': conn.execute('SELECT COUNT(*) as count FROM bookings').fetchone()['count'],
        'pending_kyc': conn.execute('SELECT COUNT(*) as count FROM service_providers WHERE kyc_status = "pending"').fetchone()['count'],
        'total_revenue': conn.execute('SELECT SUM(total_amount) as total FROM bookings WHERE status = "completed"').fetchone()['total'] or 0
    }
    
    # Recent activities
    recent_users = conn.execute('''
        SELECT full_name, email, created_at FROM users 
        WHERE role = "user" 
        ORDER BY created_at DESC LIMIT 5
    ''').fetchall()
    
    recent_providers = conn.execute('''
        SELECT business_name, email, kyc_status, created_at FROM service_providers 
        ORDER BY created_at DESC LIMIT 5
    ''').fetchall()
    
    recent_bookings = conn.execute('''
        SELECT b.*, u.full_name as customer_name, sp.business_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN service_providers sp ON b.provider_id = sp.id
        ORDER BY b.created_at DESC LIMIT 10
    ''').fetchall()
    
    conn.close()
    
    return render_template('admin_dashboard.html',
                         stats=stats,
                         recent_users=recent_users,
                         recent_providers=recent_providers,
                         recent_bookings=recent_bookings)

@app.route('/admin/services')
@admin_required
def admin_services():
    """Admin service management"""
    conn = get_db_connection()
    services = conn.execute('SELECT * FROM services ORDER BY category, name').fetchall()
    conn.close()
    
    return render_template('admin_services.html', services=services)

@app.route('/admin/services/add', methods=['POST'])
@admin_required
def add_service():
    """Add new service"""
    name = request.form['name'].strip()
    category = request.form['category']
    description = request.form.get('description', '').strip()
    
    if not name or not category:
        flash('Name and category are required')
        return redirect(url_for('admin_services'))
    
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO services (name, category, description)
            VALUES (?, ?, ?)
        ''', (name, category, description))
        conn.commit()
        flash('Service added successfully!')
    except Exception as e:
        flash('Failed to add service')
    finally:
        conn.close()
    
    return redirect(url_for('admin_services'))

@app.route('/admin/services/<int:service_id>/toggle')
@admin_required
def toggle_service_status(service_id):
    """Toggle service active status"""
    conn = get_db_connection()
    
    service = conn.execute('SELECT is_active FROM services WHERE id = ?', (service_id,)).fetchone()
    if service:
        new_status = not service['is_active']
        conn.execute('UPDATE services SET is_active = ? WHERE id = ?', (new_status, service_id))
        conn.commit()
        flash(f'Service {"activated" if new_status else "deactivated"} successfully!')
    else:
        flash('Service not found')
    
    conn.close()
    return redirect(url_for('admin_services'))

@app.route('/admin/providers')
@admin_required
def admin_providers():
    """Admin provider management"""
    conn = get_db_connection()
    providers = conn.execute('''
        SELECT sp.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
        FROM service_providers sp
        LEFT JOIN reviews r ON sp.id = r.provider_id
        GROUP BY sp.id
        ORDER BY sp.created_at DESC
    ''').fetchall()
    conn.close()
    
    return render_template('admin_providers.html', providers=providers)

@app.route('/admin/providers/<int:provider_id>/kyc/<action>')
@admin_required
def update_kyc_status(provider_id, action):
    """Update provider KYC status"""
    conn = get_db_connection()
    
    if action == 'approve':
        conn.execute('''
            UPDATE service_providers 
            SET kyc_verified = 1, kyc_status = 'verified' 
            WHERE id = ?
        ''', (provider_id,))
        flash('Provider KYC approved!')
    elif action == 'reject':
        conn.execute('''
            UPDATE service_providers 
            SET kyc_verified = 0, kyc_status = 'rejected' 
            WHERE id = ?
        ''', (provider_id,))
        flash('Provider KYC rejected!')
    
    conn.commit()
    conn.close()
    
    return redirect(url_for('admin_providers'))

# Logout routes
@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('Logged out successfully!')
    return redirect(url_for('home'))

@app.route('/provider/logout')
def provider_logout():
    """Provider logout"""
    session.clear()
    flash('Logged out successfully!')
    return redirect(url_for('home'))

# API endpoints for AJAX calls
@app.route('/api/services')
def api_services():
    """Get services as JSON"""
    active_only = request.args.get('active', 'false').lower() == 'true'
    
    conn = get_db_connection()
    if active_only:
        services = conn.execute('SELECT * FROM services WHERE is_active = 1 ORDER BY category, name').fetchall()
    else:
        services = conn.execute('SELECT * FROM services ORDER BY category, name').fetchall()
    conn.close()
    
    return jsonify([dict(service) for service in services])

@app.route('/api/providers')
def api_providers():
    """Get providers as JSON"""
    service_name = request.args.get('service')
    
    conn = get_db_connection()
    if service_name:
        providers = conn.execute('''
            SELECT sp.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
            FROM service_providers sp
            LEFT JOIN reviews r ON sp.id = r.provider_id
            WHERE sp.service_name = ? AND sp.kyc_verified = 1
            GROUP BY sp.id
            ORDER BY avg_rating DESC
        ''', (service_name,)).fetchall()
    else:
        providers = conn.execute('''
            SELECT sp.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
            FROM service_providers sp
            LEFT JOIN reviews r ON sp.id = r.provider_id
            WHERE sp.kyc_verified = 1
            GROUP BY sp.id
            ORDER BY avg_rating DESC
        ''').fetchall()
    conn.close()
    
    return jsonify([dict(provider) for provider in providers])

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)