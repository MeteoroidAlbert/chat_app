function Avatar({ userId, username, online, radius }) {
    const colors = ["bg-red-200", "bg-green-200",
        "bg-purple-200", "bg-blue-200",
        "bg-yellow-200", "bg-teal-200",
        "bg-orange-300", "bg-lime-500",
        "bg-fuchsia-600", "bg-cyan-700"];

    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    const radiusList = [
        "w-8 h-8", "w-10 h-10", "w-12, h-12"
    ]
    const radiusSize = radiusList[radius];

    return (
        <div className={`relative rounded-full flex items-center justify-center ${color} ${radiusSize}` }>
            <div>{username[0].toUpperCase()}</div>
            {online && (
                <div className="absolute -bottom-1 right-0 w-3 h-3 bg-green-500 rounded-full border border-white" />
            )}
            {!online && (
                <div className="absolute -bottom-1 right-0 w-3 h-3 bg-gray-500 rounded-full border border-white" />
            )}
        </div>
    );
};

export default Avatar;