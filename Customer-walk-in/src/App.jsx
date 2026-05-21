import { useContext, useEffect, useMemo } from "react";
import { Link, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { StoreContext } from "./context/StoreContext.jsx";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import TableModal from "./components/TableModal.jsx";

const App = () => {
  const { cartItems, tableNumber, restaurantId, setTableNumber } = useContext(StoreContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (restaurantId) {
      params.set("restaurantId", restaurantId);
    }

    if (tableNumber) {
      params.set("table", tableNumber);
    }

    const serialized = params.toString();
    return serialized ? `?${serialized}` : "";
  }, [restaurantId, tableNumber]);

  const cartCount = useMemo(() => {
    return Object.values(cartItems).reduce((total, qty) => total + qty, 0);
  }, [cartItems]);

  useEffect(() => {
    if (tableParam && tableParam !== tableNumber) {
      setTableNumber(tableParam);
    }
  }, [tableParam, tableNumber, setTableNumber]);

  const handleTableSubmit = (value) => {
    const nextParams = new URLSearchParams();

    if (restaurantId) {
      nextParams.set("restaurantId", restaurantId);
    }

    nextParams.set("table", value);

    setSearchParams(nextParams);
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
          <Link to={`/menu${queryString}`} className="nav-link">Menu</Link>
          <Link to={`/cart${queryString}`} className="nav-link">
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
