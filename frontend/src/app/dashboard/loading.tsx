export default function Loading() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '50vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6',
                    borderRadius: '50%', width: '40px', height: '40px',
                    animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto'
                }}></div>
                <p style={{ color: '#6b7280', fontWeight: '500' }}>Loading data, please wait...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
