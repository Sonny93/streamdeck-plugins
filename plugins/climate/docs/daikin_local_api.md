# Daikin local API: reference

What the driver of the plugin relies on, as observed on a wifi module of the `aircon` family. Addresses, MAC addresses and names are left out of this document and of the repository.

## The two families of modules

| `type` in `basic_info` | Firmware `ver` | `adp_kind` | Local HTTP API `/aircon/*`    |
| ---------------------- | -------------- | ---------- | ----------------------------- |
| `aircon`               | `4_2_303`      | 3          | yes                           |
| `GPF`                  | `2_6_2`        | 4          | no (every path answers `404`) |

The `type` field tells the families apart: `aircon` is the classic API, `GPF` (with `protocol=DGC`) is the newer cloud-driven module. The plugin only supports `aircon`.

## HTTP transport

The module answers `HTTP 403` with no body to every request made with the `fetch` built into Node (undici), while curl and `node:http` get `200` with the same headers. The driver therefore uses `node:http` with `Connection: close` (no keep-alive).

The module serves one request at a time. The driver sends the requests of one unit one after the other.

Every answer is one line of `key=value` pairs separated by commas, starting with `ret=OK`. A failure answers `ret=PARAM NG` or `ret=ADV_NG`. A `name` is URL-encoded byte by byte, including ASCII characters (`%54%65%73%74`).

## Reads

### `GET /common/basic_info`

```
ret=OK,type=aircon,reg=eu,dst=1,ver=4_2_303,rev=30610C5A,pow=0,err=0,location=0,name=%54%65%73%74,icon=0,instform=0,method=polling,port=30050,id=<uuid>,pw=,lpw_flag=0,adp_kind=3,pv=3.2,cpv=3,cpv_minor=20,led=1,en_setzone=1,mac=<mac>,ssid=DaikinAP<n>,adp_mode=run,en_hol=0,radio1=-69,grp_name=,en_grp=0,ssid1=<ssid of the LAN>,sec_type=WPA2
```

- `type` tells the family, `mac` is what a DHCP reservation needs, `radio1` is the wifi signal in dBm.
- The plugin reads this path once, when an address is saved, and accepts the unit only when `type=aircon`.

### `GET /aircon/get_model_info`

```
ret=OK,model=10F6,type=N,pv=3.2,cpv=3,cpv_minor=20,mid=NA,humd=0,s_humd=0,acled=0,land=0,elec=1,temp=1,temp_rng=0,m_dtct=1,ac_dst=--,disp_dry=0,dmnd=1,en_scdltmr=1,en_frate=1,en_rtemp_a=0,en_spmode=7,en_ipw_sep=1,en_mompow=1,en_patrol=0,en_filter_sign=0,shtyp=0,en_cjlink=1,en_onofftmr=1,hmlmt_l=10.0,en_fdir=1,s_fdir=3
```

| Field            | Value | Meaning                                                           |
| ---------------- | ----- | ----------------------------------------------------------------- |
| `en_frate`       | 1     | the fan rate can be set (`f_rate`)                                |
| `en_fdir`        | 1     | the louvers can be set                                            |
| `s_fdir`         | 3     | vertical and horizontal swing are supported (`f_dir` from 0 to 3) |
| `humd`, `s_humd` | 0     | no humidity sensor and no humidity setpoint                       |
| `en_spmode`      | 7     | special modes available (powerful, econo, streamer)               |
| `en_mompow`      | 1     | instant power reported (`mompow`)                                 |

### `GET /aircon/get_sensor_info`

```
ret=OK,htemp=23.0,hhum=-,otemp=4.0,err=0,cmpfreq=0,mompow=1
```

- `htemp` is the room temperature and `otemp` the outdoor temperature.
- `hhum=-` means there is no humidity sensor: `-` and `--` both read as "no value".
- `cmpfreq` is the compressor frequency, `0` when it is stopped.

### `GET /aircon/get_control_info`

```
ret=OK,pow=0,mode=3,adv=,stemp=21.0,shum=0,dt1=25.0,dt2=M,dt3=21.0,dt4=25.0,dt5=25.0,dt7=25.0,dh1=AUTO,dh2=50,dh3=0,dh4=0,dh5=0,dh7=AUTO,dhh=50,b_mode=3,b_stemp=21.0,b_shum=0,alert=255,f_rate=A,b_f_rate=A,dfr1=A,dfr2=A,dfr3=A,dfr4=A,dfr5=A,dfr6=A,dfr7=A,dfrh=A,f_dir=0,b_f_dir=0,dfd1=0,dfd2=0,dfd3=0,dfd4=0,dfd5=0,dfd6=0,dfd7=0,dfdh=0,dmnd_run=0,en_demand=0
```

| Field    | Values                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------- |
| `pow`    | `0` off, `1` on                                                                                 |
| `mode`   | `0`, `1` and `7` auto, `2` dry, `3` cool, `4` heat, `6` fan                                     |
| `stemp`  | target temperature in degrees, `M` or `--` when the mode has none                               |
| `shum`   | target humidity, `AUTO`, `0` or `--`                                                            |
| `f_rate` | `A` auto, `B` silent, `3` to `7` for the rates 1 to 5                                           |
| `f_dir`  | `0` fixed, `1` vertical, `2` horizontal, `3` both                                               |
| `adv`    | active special modes separated by `/`, empty when none: `2` powerful, `12` econo, `13` streamer |
| `alert`  | `255` when there is no alert                                                                    |

How this unit differs from the generic description of the API:

- **`dt6` and `dh6` are absent**: the unit memorizes no setpoint for the fan mode.
- `dt2=M`: no temperature setpoint in dry mode, the target humidity is `dh2`.
- `dh1=AUTO` and `dh7=AUTO`: `shum` can hold the literal `AUTO`.
- `dtN`, `dhN`, `dfrN` and `dfdN` are the setpoint, humidity, fan rate and louvers memorized for the mode `N`.
- `b_mode`, `b_stemp`, `b_shum`, `b_f_rate` and `b_f_dir` copy the current state and have no known use.

### `GET /aircon/get_timer`

Answers `404`: the timers are not readable over this API.

### `GET /aircon/get_week_power_ex`

```
ret=OK,s_dayw=1,week_heat=0/0/1/0/5/11/14/22/3/0/0/0/0/0,week_cool=0/0/0/0/3/2/1/1/1/0/1/0/1/1
```

- `week_heat` and `week_cool` each hold 14 daily values separated by `/`, in units of 0.1 kWh: the energy used while heating and while cooling.
- Index 0 is today and index N is N days ago (checked against the monthly endpoint).
- The plugin reads today (index 0) and the sum of the last seven days (indexes 0 to 6), in kWh. A list that does not hold 14 whole numbers is a protocol error.
- `s_dayw` is not used.

### The other energy endpoints

`/aircon/get_week_power`, `/aircon/get_day_power_ex`, `/aircon/get_month_power_ex` and `/aircon/get_year_power_ex` answer `200`. The plugin does not use them.

## Writes

### `GET /aircon/set_control_info`

Takes the six parameters `pow`, `mode`, `stemp`, `shum`, `f_rate` and `f_dir`, and answers `ret=OK` once it applies them. All six must be sent, so the driver reads `get_control_info` first and merges the change onto it, which keeps the raw values it does not model (auto written as `0`, `1` or `7`, `stemp=M`, `shum=AUTO`).

- **Same mode**: `stemp`, `shum`, `f_rate` and `f_dir` keep their current values unless the change sets them.
- **Mode change**: the unit expects the values memorized for the new mode: `stemp=dt<mode>`, `shum=dh<mode>`, `f_rate=dfr<mode>` and `f_dir=dfd<mode>`.
- **Fan mode** is written with `stemp=--&shum=--`, since no setpoint is memorized for it.
- A temperature is written with one decimal (`21.0`), in steps of 0.5.
- Setpoint ranges: 18 to 32 in cool, 10 to 30 in heat, 18 to 30 in auto. Dry and fan have none.
- The driver writes, then reads `get_control_info` again to return the state the unit actually holds. When the write was accepted but the read fails, the outcome is unknown and the driver reports it as unconfirmed: the caller must read before deciding anything, and never resend the same write.

### `GET /aircon/set_special_mode`

```
/aircon/set_special_mode?set_spmode=<1|0>&spmode_kind=<1|2>
```

- `set_spmode`: `1` turns the mode on, `0` turns it off.
- `spmode_kind`: `1` powerful, `2` econo.

The answer is `ret=OK,adv=2` after powerful is turned on, `ret=OK,adv=12` after econo is turned on, and `ret=OK,adv=` after a mode is turned off. Turning one on replaces the other. The streamer mode is not written through this path.

## Sensors while the unit is off

With the unit off (`pow=0`, `cmpfreq=0`), `htemp` and `otemp` are still reported as numbers, never `-`, and follow the real conditions: over twenty readings a minute apart at night they stayed stable, and two hours later they had moved with the room and the weather. Compared with a thermometer in the room and the real outdoor temperature, both probes are about 1 degree off. The values observed are whole degrees (`.0`).
