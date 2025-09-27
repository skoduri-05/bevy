// Types aligned to your screenshots.
export type UUID = string;


export type Profile = {
id: UUID; // uuid PK
handle: string | null; // text
name: string | null; // text
email: string | null; // text
followers: UUID[] | null; // _uuid (array)
following: UUID[] | null; // _uuid (array)
created_at: string | null; // timestamptz
bio: string | null; // text
avatar_url: string | null; // text
updated_at: string | null; // timestamptz
preferred_tags: string[] | null; // _text
wishlist: UUID[] | null; // _uuid (array of recipe uuids)
};


export type Recipe = {
uuid: UUID; // uuid PK
drink_name: string; // text
location_purchased: string | null; // text
price: number | null; // numeric
rating: number | null; // int4 (user rating)
tags: string[] | null; // _text
poster_id: UUID; // uuid (profiles.id)
thoughts: string | null; // text
recipe: string | null; // text
image_url: string | null; // text
universal_rating: number | null; // numeric
rating_count: number | null; // int4
};


// Query helpers
export type WithUser<T> = T & { user?: Pick<Profile, "name" | "handle" | "avatar_url"> };