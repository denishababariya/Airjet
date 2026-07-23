import React, { useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { MdSearch, MdPerson, MdShoppingCart, MdBuild, MdInventory, MdPointOfSale, MdArrowForward } from 'react-icons/md';

const TYPE_ICONS = {
  'Employee': MdPerson,
  'Customer': MdPointOfSale,
  'Supplier': MdShoppingCart,
  'Stock': MdInventory,
  'Spare Part': MdBuild,
  'SALES': MdPointOfSale,
  'PURCHASE': MdShoppingCart,
  'WAREHOUSE': MdInventory,
  'SERVICE': MdBuild,
  'PAYROLL': MdPerson,
  'ACCOUNTS': MdPointOfSale,
};

const TYPE_COLORS = {
  'Employee': '#4e73df',
  'Customer': '#1cc88a',
  'Supplier': '#f6c23e',
  'Stock': '#36b9cc',
  'Spare Part': '#e74a3b',
  'SALES': '#1cc88a',
  'PURCHASE': '#f6c23e',
  'WAREHOUSE': '#36b9cc',
  'SERVICE': '#e74a3b',
  'PAYROLL': '#4e73df',
  'ACCOUNTS': '#1cc88a',
};

const SearchResults = ({ setActiveMenu }) => {
  const { searchQuery, searchResults, isSearching, searchError, performSearch, clearSearch } = useSearch();

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  const handleResultClick = (result) => {
    setActiveMenu(result.link);
  };

  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {});

  return (
    <div className="d_page_content">
      <div className="d_card">
        <div className="d_card_header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="d_card_title mb-0">Search Results</h5>
            <p className="d_text_muted mb-0 mt-1">
              {searchQuery ? `Results for "${searchQuery}"` : 'Enter a search term to find results'}
            </p>
          </div>
          {searchQuery && (
            <button
              className="d_btn d_btn_outline d_btn_sm"
              onClick={clearSearch}
            >
              Clear Search
            </button>
          )}
        </div>

        <div className="d_card_body">
          {isSearching && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Searching...</span>
              </div>
              <p className="mt-3 d_text_muted">Searching across all modules...</p>
            </div>
          )}

          {searchError && (
            <div className="alert alert-danger" role="alert">
              {searchError}
            </div>
          )}

          {!isSearching && !searchError && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-5">
              <MdSearch size={48} className="d_text_muted mb-3" />
              <h5 className="d_text_muted">No results found</h5>
              <p className="d_text_muted">Try adjusting your search term</p>
            </div>
          )}

          {!isSearching && !searchError && searchResults.length > 0 && (
            <div>
              <p className="d_text_muted mb-3">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} across {Object.keys(groupedResults).length} categor{Object.keys(groupedResults).length !== 1 ? 'ies' : 'y'}
              </p>

              {Object.entries(groupedResults).map(([type, items]) => {
                const IconComponent = TYPE_ICONS[type] || MdSearch;
                const color = TYPE_COLORS[type] || '#666';

                return (
                  <div key={type} className="mb-4">
                    <h6 className="d_fw_600 mb-3 d-flex align-items-center gap-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded "
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: color + '20',
                          color: color,
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      {type}
                      <span className="badge bg-secondary ms-auto">{items.length}</span>
                    </h6>

                    <div className="d_table_wrap">
                      <table className="d_table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={`${item.type}-${item.id}-${idx}`}>
                              <td>
                                <span className="d_fw_500">{item.name}</span>
                              </td>
                              <td>
                                <span className="d_text_muted">{item.description}</span>
                              </td>
                              <td>
                                <button
                                  className="d_btn d_btn_sm d_btn_primary"
                                  onClick={() => handleResultClick(item)}
                                >
                                  View <MdArrowForward size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchQuery && !isSearching && (
            <div className="text-center py-5">
              <MdSearch size={48} className="d_text_muted mb-3" />
              <h5 className="d_text_muted">Start searching</h5>
              <p className="d_text_muted">Use the search bar in the navbar to search across all modules</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
