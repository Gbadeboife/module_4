-- Lua script for atomic ticket purchase per event
-- KEYS[1]: event ticket list key (e.g., event:1:tickets)
local ticket = redis.call('LPOP', KEYS[1])
if ticket then
  return ticket
else
  return nil
end
