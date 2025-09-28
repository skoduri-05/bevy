export default function About() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Mission Statement */}
            <section className="mb-12 text-center">
                <h1 className="text-3xl font-bold mb-4">Our Mission</h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                    At <span className="font-semibold">Bevi</span>, our mission is to connect
                    communities through technology that inspires collaboration, creativity,
                    and human connection. We believe in building tools that bring people
                    closer together and make everyday interactions more meaningful.
                </p>
            </section>

            {/* Team */}
            <section>
                <h2 className="text-2xl font-semibold mb-6 text-center">Meet the Team</h2>
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                    {/* Person 1 */}
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="https://placehold.co/150x150"
                            alt="Alice Johnson"
                            className="w-28 h-28 rounded-full mb-3 object-cover"
                        />
                        <h3 className="font-medium text-lg">Alice Johnson</h3>
                        <p className="text-gray-500 text-sm">CEO & Visionary</p>
                    </div>

                    {/* Person 2 */}
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="https://placehold.co/150x150"
                            alt="Brian Lee"
                            className="w-28 h-28 rounded-full mb-3 object-cover"
                        />
                        <h3 className="font-medium text-lg">Brian Lee</h3>
                        <p className="text-gray-500 text-sm">Head of Engineering</p>
                    </div>

                    {/* Person 3 */}
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="https://placehold.co/150x150"
                            alt="Carla Mendes"
                            className="w-28 h-28 rounded-full mb-3 object-cover"
                        />
                        <h3 className="font-medium text-lg">Carla Mendes</h3>
                        <p className="text-gray-500 text-sm">Design Lead</p>
                    </div>

                    {/* Person 4 */}
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="https://placehold.co/150x150"
                            alt="David Chen"
                            className="w-28 h-28 rounded-full mb-3 object-cover"
                        />
                        <h3 className="font-medium text-lg">David Chen</h3>
                        <p className="text-gray-500 text-sm">Product Manager</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
