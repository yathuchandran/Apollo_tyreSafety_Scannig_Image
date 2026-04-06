import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CameraCapture from '../cameraCapture';

const Home: React.FC = () => {
    const [showCamera, setShowCamera] = useState(false);

    const handleCapturedVideo = (videoUrl: string) => {
        console.log("Captured Video:", videoUrl);
        setShowCamera(false);

        // TODO: preview / upload
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 p-4 md:p-8">
            <div className="max-w-md mx-auto">

                <div className="text-center mb-10 pt-8">
                    <h1 className="text-3xl font-bold text-gray-800">Apollo</h1>
                    <p className="text-gray-600">Tyre Tread Analysis System</p>
                </div>

                <button
                    onClick={() => setShowCamera(true)}
                    className="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 border-2 border-blue-100 hover:border-blue-300 transition-all"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Capture Tyre Video
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Tap to scan tyre tread
                        </p>
                    </div>
                </button>

                {showCamera && (
                    <CameraCapture
                        onCapture={handleCapturedVideo}
                        onClose={() => setShowCamera(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;