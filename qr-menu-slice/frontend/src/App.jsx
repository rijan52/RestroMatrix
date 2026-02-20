import { useContext, useEffect, useMemo } from "react";
import { Link, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { StoreContext } from "./context/StoreContext.jsx";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import TableModal from "./components/TableModal.jsx";

const App = () => {
  const { cartItems, tableNumber, setTableNumber } = useContext(StoreContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableQuery = tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : "";

  const cartCount = useMemo(() => {
    return Object.values(cartItems).reduce((total, qty) => total + qty, 0);
  }, [cartItems]);

  useEffect(() => {
    if (tableParam && tableParam !== tableNumber) {
      setTableNumber(tableParam);
    }
  }, [tableParam, tableNumber, setTableNumber]);

  const handleTableSubmit = (value) => {
    setSearchParams({ table: value });
    setTableNumber(value);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">RM</span>
          <div>
            <p className="brand-title">RestroMatrix</p>
            <p className="brand-sub">QR menu + ordering</p>
          </div>
        </div>
        <nav className="topnav">
          <Link to={`/menu${tableQuery}`} className="nav-link">Menu</Link>
          <Link to={`/cart${tableQuery}`} className="nav-link">
            Cart
            <span className="cart-pill">{cartCount}</span>
          </Link>
          {tableNumber ? <span className="table-pill">Table {tableNumber}</span> : null}
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>

      <TableModal isOpen={!tableParam} onSubmit={handleTableSubmit} />
    </div>
  );
};

export default App;
