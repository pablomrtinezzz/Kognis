from supabase import Client, create_client

from src.core.config import settings


def get_supabase_client() -> Client:
    """
    Initializes and returns the Supabase client using the Service Role Key.

    WARNING: The Service Role Key bypasses Row Level Security (RLS).
    This client should only be used for internal backend operations
    where authorization has already been validated.
    """
    supabase: Client = create_client(
        supabase_url=settings.SUPABASE_URL, supabase_key=settings.SUPABASE_SERVICE_KEY
    )
    return supabase


# Global database client instance
db = get_supabase_client()
