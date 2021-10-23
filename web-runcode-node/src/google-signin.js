function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log("User signed out.");
    });
  }

  function onSuccess(googleUser) {
    let profile = googleUser.getBasicProfile()
    console.log("ID: " + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log("Name: " + profile.getName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail()); // This is null if the 'email' scope is not present.
    console.log(googleUser);
    var showProfile = document.getElementById("profile")

    let textbox = document.createElement("div");
    textbox.innerText = profile.getEmail();
    // textbox.setAttribute("class", "text-gray-900");
    // textbox.setAttribute("class", "leading-none");

    let box = document.createElement("div");
    box.setAttribute("class", "mx-auto grid grid-cols-2");

    
    var image = document.createElement("IMG");
    image.setAttribute("src", profile.getImageUrl());
    image.setAttribute("class", "h-10 w-10 rounded-full");
   
    box.appendChild(image);
    box.appendChild(textbox);
    showProfile.append(box);
    
  }

  function onFailure(error) {
    console.log(error);
  }

  function renderButton() {
    gapi.signin2.render("my-signin2", {
      scope: "profile email",
      width: 240,
      height: 50,
      longtitle: true,
      theme: "dark",
      onsuccess: onSuccess,
      onfailure: onFailure
    });
  }