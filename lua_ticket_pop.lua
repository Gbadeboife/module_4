-- Optimized Lua script for atomic ticket purchase per event
-- KEYS[1]: event ticket list key (e.g., event:1:tickets)
-- Returns the ticket string or nil if sold out
local ticket = redis.call('LPOP', KEYS[1])
return ticket
