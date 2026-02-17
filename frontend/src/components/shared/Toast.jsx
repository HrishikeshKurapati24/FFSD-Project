import React from 'react';

const Toast = ({ message, type = 'success', onClose, show }) => {
    if (!show) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#28a745';
            case 'error':
                return '#dc3545';
            case 'warning':
                return '#ffc107';
            case 'info':
                return '#17a2b8';
            default:
                return '#6c757d';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'info':
                return 'fa-info-circle';
            default:
                return 'fa-bell';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                minWidth: '300px',
                maxWidth: '500px',
                backgroundColor: getBackgroundColor(),
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <i className={`fas ${getIcon()} me-2`} style={{ fontSize: '20px' }}></i>
                <span>{message}</span>
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px'
                }}
            >
                <i className="fas fa-times"></i>
            </button>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Toast;
