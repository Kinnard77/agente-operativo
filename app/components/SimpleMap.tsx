'use client';

const SimpleMap = ({ trips }: any) => {
    return (
        <div className="bg-slate-200 p-4 rounded text-center h-[400px] flex items-center justify-center">
            <p>Mapa Placeholder ({trips.length} trips)</p>
        </div>
    );
};

export default SimpleMap;
