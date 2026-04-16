import React, { useEffect, useMemo, useRef, useState } from 'react'
import './List.css'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

const List = ({ url }) => {

  const [list, setList] = useState([]);
  const [showWalkInQR, setShowWalkInQR] = useState(false);
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const walkInQrRef = useRef();

  const walkInUrl = useMemo(() => {
    const configuredUrl = import.meta.env.VITE_CUSTOMER_WALKIN_URL;

    const appendRestaurantId = (urlValue) => {
      if (!urlValue) return '';

      const resolvedUrl = new URL(urlValue, window.location.origin);
      if (restaurantId) {
        resolvedUrl.searchParams.set('restaurantId', restaurantId);
      }
      return resolvedUrl.toString();
    };

    if (configuredUrl) return appendRestaurantId(configuredUrl);

    const walkInProtocol = import.meta.env.VITE_CUSTOMER_WALKIN_PROTOCOL || window.location.protocol;
    const walkInHost = import.meta.env.VITE_CUSTOMER_WALKIN_HOST || window.location.hostname || 'localhost';
    const walkInPort = import.meta.env.VITE_CUSTOMER_WALKIN_PORT || '5176';
    const configuredBaseUrl =
      import.meta.env.VITE_CUSTOMER_WALKIN_BASE_URL ||
      `${walkInProtocol}//${walkInHost}${walkInPort ? `:${walkInPort}` : ''}`;
    const configuredRoute = import.meta.env.VITE_CUSTOMER_WALKIN_ROUTE || '/menu';

    const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
      ? configuredBaseUrl.slice(0, -1)
      : configuredBaseUrl;
    const normalizedRoute = configuredRoute.startsWith('/')
      ? configuredRoute
      : `/${configuredRoute}`;

    return appendRestaurantId(`${normalizedBaseUrl}${normalizedRoute}`);
  }, [restaurantId]);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`, {
      params: { restaurantId }
    });
    if (response.data.success) {
      setList(response.data.data);
    }
    else {
      toast.error("Error");
    }
  }

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, { id: foodId })
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message)
    }
    else {
      toast.error("Error");
    }
  }

  const handleEditFood = (foodItem) => {
    // Store food data in local storage for the edit form
    localStorage.setItem('editFood', JSON.stringify(foodItem));
    navigate(`/restaurant/${restaurantId}/add`);
  }

  useEffect(() => {
    fetchList();
  }, [restaurantId])

  const handleGenerateWalkInQR = () => {
    setShowWalkInQR(true);
  }

  const handleDownloadWalkInQR = async () => {
    if (!walkInQrRef.current) return;

    try {
      const dataUrl = await toPng(walkInQrRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = 'customer-walk-in-qr.png';
      link.href = dataUrl;
      link.click();
      toast.success('Walk-in QR downloaded');
    } catch (error) {
      toast.error('Failed to download Walk-in QR');
    }
  }

  const handlePrintWalkInQR = async () => {
    if (!walkInQrRef.current) return;

    try {
      const dataUrl = await toPng(walkInQrRef.current, { cacheBust: true });
      const printWindow = window.open('', '', 'width=600,height=700');

      printWindow.document.write(`
                <html>
                <head>
                    <title>Customer Walk-in QR</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        h1 { margin: 10px 0; }
                        .url {
                            margin: 8px 0;
                            font-size: 14px;
                            color: #334155;
                            word-break: break-all;
                            text-align: center;
                        }
                        img { margin: 20px 0; border: 2px solid #333; padding: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Customer Walk-in QR</h1>
                    <p class="url">${walkInUrl}</p>
                    <img src="${dataUrl}" />
                </body>
                </html>
            `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      toast.error('Failed to print Walk-in QR');
    }
  }

  return (
    <div className='list'>
      <div className="list-header">
        <h2>All Food Items</h2>
        <p className="list-subtitle">Manage your food items</p>
      </div>

      <div className="walkin-qr-card">
        <div className="walkin-qr-head">
          <h3>Customer Walk-in QR</h3>
          <p>Generate a QR code for customers to open the walk-in ordering page.</p>
        </div>

        <div className="walkin-qr-controls">
          <button type="button" onClick={handleGenerateWalkInQR} className="list-walkin-btn">
            Generate Walk-in QR
          </button>
          {showWalkInQR && (
            <button type="button" onClick={() => setShowWalkInQR(false)} className="walkin-btn-close">
              Close QR
            </button>
          )}
        </div>

        {showWalkInQR && (
          <div className="walkin-qr-body">
            <div className="walkin-qr-preview" ref={walkInQrRef}>
              <QRCode
                value={walkInUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="walkin-url-display">
              <label>Walk-in URL</label>
              <input type="text" readOnly value={walkInUrl} className="walkin-link-input" />
            </div>

            <div className="walkin-action-buttons">
              <button type="button" onClick={handleDownloadWalkInQR} className="walkin-btn-secondary">
                Download PNG
              </button>
              <button type="button" onClick={handlePrintWalkInQR} className="walkin-btn-primary">
                Print QR
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Actions</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format data">
              <img src={`${url}/images/` + item.image} alt={item.name} />
              <p className="item-name">{item.name}</p>
              <p className="item-category">{item.category}</p>
              <p className="item-price">Rs{item.price}</p>
              <div className="actions">
                <button className="btn-edit" onClick={() => handleEditFood(item)} title="Edit food item">
                  ✎
                </button>
                <button className="btn-delete" onClick={() => removeFood(item._id)} title="Delete food item">
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List