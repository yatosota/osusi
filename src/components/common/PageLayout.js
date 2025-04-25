import React from 'react';

const PageLayout = ({ children, centerContent = false }) => (
  <div className={`min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${
    centerContent ? 'flex items-center justify-center' : ''
  }`}>
    {children}
  </div>
);

export default PageLayout; 