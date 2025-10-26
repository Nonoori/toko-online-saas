// src/components/layout/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={footerStyle}>
      <small>
        Powered by{' '}
        <Link to="/" style={linkStyle}>
          TokoSaaS Platform
        </Link>
        {' '}© {new Date().getFullYear()}
      </small>
      {/* You could add a small logo here too */}
      {/* <Link to="/"><img src="/path/to/superadmin-logo-small.png" alt="TokoSaaS Platform" style={{ height: '20px' }} /></Link> */}
    </footer>
  );
}

// Basic CSS for the footer
const footerStyle = {
  marginTop: '50px', // Add some space above the footer
  padding: '20px',
  textAlign: 'center',
  borderTop: '1px solid #eee',
  backgroundColor: '#f9f9f9',
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'none',
};

export default Footer;