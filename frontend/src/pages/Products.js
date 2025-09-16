import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { Search, Grid, List, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const { addToCart } = useCart();

  const { data: productsData, isLoading } = useQuery(
    ['products', { search: searchTerm, category: selectedCategory, sortBy, sortOrder, page: currentPage }],
    () => productService.getProducts({
      search: searchTerm,
      category: selectedCategory,
      sortBy,
      sortOrder,
      page: currentPage,
      limit: 12
    }),
    {
      select: (data) => data.data
    }
  );

  const { data: categoriesData } = useQuery(
    'categories',
    () => productService.getCategories(),
    {
      select: (data) => data.data
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // const handleSortChange = (field) => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortBy(field);
  //     setSortOrder('asc');
  //   }
  // };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const totalPages = productsData?.pagination?.total_pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categoriesData?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="created_at">Date Added</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {productsData?.products?.map((product) => (
              <div key={product.id} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex' : ''
              }`}>
                <div className={`${viewMode === 'list' ? 'w-48' : 'w-full'} aspect-w-16 aspect-h-9`}>
                  <img
                    src={product.image_url || 'https://via.placeholder.com/400x300'}
                    alt={product.name}
                    className={`${viewMode === 'list' ? 'w-full h-32' : 'w-full h-48'} object-cover rounded-t-lg`}
                  />
                </div>
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock_quantity}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">
                      ${product.price}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        disabled={product.stock_quantity === 0}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <Link
                        to={`/products/${product.id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        isCurrentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
