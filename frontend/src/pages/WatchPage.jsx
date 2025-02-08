import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContentStore } from "../store/content";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactPlayer from "react-player";
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from "../utils/constants";
import { formatReleaseDate } from "../utils/dateFunction";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";

const WatchPage = () => {
	const { id } = useParams();
	const [trailers, setTrailers] = useState([]);
	const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
	const [loading, setLoading] = useState(true);
	const [content, setContent] = useState({});
	const [similarContent, setSimilarContent] = useState([]);
	const { contentType } = useContentStore();
	const [embedUrl, setEmbedUrl] = useState(""); // Store Vidsrc URL

	const sliderRef = useRef(null);

	// Fetch trailers
	useEffect(() => {
		const getTrailers = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/trailers`);
				setTrailers(res.data.trailers);
			} catch (error) {
				setTrailers([]);
			}
		};

		getTrailers();
	}, [contentType, id]);

	// Fetch similar content
	useEffect(() => {
		const getSimilarContent = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/similar`);
				setSimilarContent(res.data.similar);
			} catch (error) {
				setSimilarContent([]);
			}
		};

		getSimilarContent();
	}, [contentType, id]);

	// Fetch content details and generate Vidsrc embed URL
	useEffect(() => {
		const getContentDetails = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/${id}/details`);
				setContent(res.data.content);

				// Generate Vidsrc URL for streaming
				let embed = `https://vidsrc.xyz/embed/${contentType}/${id}`;
				if (contentType === "tv" && res.data.content.season_number && res.data.content.episode_number) {
					embed = `https://vidsrc.xyz/embed/tv/${id}/${res.data.content.season_number}-${res.data.content.episode_number}`;
				}
				setEmbedUrl(embed);
			} catch (error) {
				setContent(null);
			} finally {
				setLoading(false);
			}
		};

		getContentDetails();
	}, [contentType, id]);

	const handleNext = () => {
		if (currentTrailerIdx < trailers.length - 1) setCurrentTrailerIdx(currentTrailerIdx + 1);
	};
	const handlePrev = () => {
		if (currentTrailerIdx > 0) setCurrentTrailerIdx(currentTrailerIdx - 1);
	};

	const scrollLeft = () => {
		if (sliderRef.current) sliderRef.current.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: "smooth" });
	};
	const scrollRight = () => {
		if (sliderRef.current) sliderRef.current.scrollBy({ left: sliderRef.current.offsetWidth, behavior: "smooth" });
	};

	if (loading)
		return (
			<div className="min-h-screen bg-black p-10">
				<WatchPageSkeleton />
			</div>
		);

	if (!content) {
		return (
			<div className="bg-black text-white h-screen flex justify-center items-center">
				<div className="text-center">
					<Navbar />
					<h2 className="text-3xl sm:text-5xl font-bold text-red-600">Content Not Found 😥</h2>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-black min-h-screen text-white">
				<Navbar />
			<div className="mx-auto container px-4 py-8">

				{/* 🎬 Movie/Episode Video Section */}
				<div className="w-full flex justify-center">
					<div className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-lg">
						<iframe
							src={embedUrl}
							width="100%"
							height="100%"
							allowFullScreen
							className="rounded-lg border-4 border-gray-700 shadow-xl"
						></iframe>
					</div>
				</div>

				{/* 🎥 Trailer Section */}
				{trailers.length > 0 && (
					<>
						<h3 className="text-3xl font-bold text-center mt-10 mb-4">🎞 Watch Trailer</h3>
						<div className="flex justify-between items-center mb-4">
							<button
								className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${
									currentTrailerIdx === 0 ? "opacity-50 cursor-not-allowed " : ""
								}`}
								disabled={currentTrailerIdx === 0}
								onClick={handlePrev}
							>
								<ChevronLeft size={24} />
							</button>

							<button
								className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${
									currentTrailerIdx === trailers.length - 1 ? "opacity-50 cursor-not-allowed " : ""
								}`}
								disabled={currentTrailerIdx === trailers.length - 1}
								onClick={handleNext}
							>
								<ChevronRight size={24} />
							</button>
						</div>

						<div className="flex justify-center">
							<div className="max-w-4xl w-full aspect-video rounded-lg overflow-hidden">
								<ReactPlayer
									controls
									width="100%"
									height="100%"
									url={`https://www.youtube.com/watch?v=${trailers[currentTrailerIdx].key}`}
								/>
							</div>
						</div>
					</>
				)}

				{/* 📌 Movie Details */}
				<div className="flex flex-col md:flex-row items-center justify-between gap-10 max-w-5xl mx-auto mt-10">
					<div className="text-center md:text-left">
						<h2 className="text-4xl font-bold text-balance">{content?.title || content?.name}</h2>
						<p className="mt-2 text-lg text-gray-300">
							{formatReleaseDate(content?.release_date || content?.first_air_date)} |{" "}
							{content?.adult ? (
								<span className="text-red-600">18+</span>
							) : (
								<span className="text-green-600">PG-13</span>
							)}
						</p>
						<p className="mt-4 text-lg">{content?.overview}</p>
					</div>
					<img
						src={ORIGINAL_IMG_BASE_URL + content?.poster_path}
						alt="Poster image"
						className="max-h-[500px] rounded-md border-4 border-gray-700 shadow-xl"
					/>
				</div>
			</div>
		</div>
	);
};

export default WatchPage;
