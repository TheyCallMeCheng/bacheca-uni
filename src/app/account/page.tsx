"use client"

import BottomMenu from "@/components/BottomMenu"

export default function Account() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 dark:text-white">
                    Account
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="space-y-6">
                        {/* Profile Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 dark:text-white">
                                Profile
                            </h2>
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                                <div>
                                    <p className="text-lg font-medium dark:text-white">
                                        Username
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        email@example.com
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 dark:text-white">
                                Settings
                            </h2>
                            <div className="space-y-4">
                                <button className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg dark:text-white">
                                    Edit Profile
                                </button>
                                <button className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg dark:text-white">
                                    Preferences
                                </button>
                                <button className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg dark:text-white">
                                    Privacy Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BottomMenu />
        </div>
    )
}
